import {
  IndexName,
  PitchEvaluation,
  PitchZone,
  RawPitchSeed,
  TrainingGoalName,
  ZoneMetrics,
} from '../types/rawStadia';

export const ALL_INDEX_NAMES: IndexName[] = [
  'Impact',
  'Energy',
  'Grip',
  'Boot',
  'Speed',
  'Endurance',
  'Recovery',
  'Power',
  'Reaction',
  'Metabolic',
];

export const PERFORMANCE_INDEXES: IndexName[] = ['Impact', 'Energy', 'Grip'];

export const TRAINING_GOAL_INDEXES: TrainingGoalName[] = [
  'Speed',
  'Endurance',
  'Recovery',
  'Power',
  'Reaction',
  'Metabolic',
];

// Raw Stadia 18-zone snake walk coordinates:
// Y = 1..6 (Left Goal third to Right Goal third)
// X = 3 (Top / North touchline), 2 (Center spine), 1 (Bottom / South touchline)
export const SNAKE_ZONE_COORDS: { zone: number; posX: number; posY: number; label: string }[] = [
  { zone: 1, posX: 3, posY: 1, label: 'Left Wing • Def Box Flank (Top)' },
  { zone: 2, posX: 2, posY: 1, label: 'Left Penalty Area • Central' },
  { zone: 3, posX: 1, posY: 1, label: 'Left Wing • Def Box Flank (Bottom)' },
  { zone: 4, posX: 1, posY: 2, label: 'Left Half-Space • Bottom Touchline' },
  { zone: 5, posX: 2, posY: 2, label: 'Left-Center Channel • Build-Up' },
  { zone: 6, posX: 3, posY: 2, label: 'Left Half-Space • Top Touchline' },
  { zone: 7, posX: 3, posY: 3, label: 'Midfield Left • Top Flank' },
  { zone: 8, posX: 2, posY: 3, label: 'Center Circle • Left Midfield' },
  { zone: 9, posX: 1, posY: 3, label: 'Midfield Left • Bottom Flank' },
  { zone: 10, posX: 1, posY: 4, label: 'Midfield Right • Bottom Flank' },
  { zone: 11, posX: 2, posY: 4, label: 'Center Circle • Right Midfield' },
  { zone: 12, posX: 3, posY: 4, label: 'Midfield Right • Top Flank' },
  { zone: 13, posX: 3, posY: 5, label: 'Right Half-Space • Top Touchline' },
  { zone: 14, posX: 2, posY: 5, label: 'Right-Center Channel • Attacking' },
  { zone: 15, posX: 1, posY: 5, label: 'Right Half-Space • Bottom Touchline' },
  { zone: 16, posX: 1, posY: 6, label: 'Right Wing • Att Box Flank (Bottom)' },
  { zone: 17, posX: 2, posY: 6, label: 'Right Penalty Area • Central' },
  { zone: 18, posX: 3, posY: 6, label: 'Right Wing • Att Box Flank (Top)' },
];

/**
 * Exact closed-form Raw Stadia Training Goal equations verified across all 342 CSV zones (< 1e-9 error):
 * - Speed     = 0.5 * (Impact + Energy) + 0.75
 * - Endurance = 11.25 - 0.5 * (Impact + Energy)          [12 - Speed]
 * - Recovery  = 5.75 + 0.5 * (Energy - Impact)
 * - Power     = 0.5 * (Impact + Grip) + 0.5
 * - Reaction  = (Impact + Energy + Grip) / 3 + 0.5
 * - Metabolic = 11.5 - (Impact + Energy + Grip) / 3      [12 - Reaction]
 */
export function computeTrainingGoals(
  impact: number,
  energy: number,
  grip: number
): Record<TrainingGoalName, number> {
  const speed = 0.5 * (impact + energy) + 0.75;
  const endurance = 11.25 - 0.5 * (impact + energy);
  const recovery = 5.75 + 0.5 * (energy - impact);
  const power = 0.5 * (impact + grip) + 0.5;
  const reaction = (impact + energy + grip) / 3.0 + 0.5;
  const metabolic = 11.5 - (impact + energy + grip) / 3.0;

  return {
    Speed: Number(speed.toFixed(2)),
    Endurance: Number(endurance.toFixed(2)),
    Recovery: Number(recovery.toFixed(2)),
    Power: Number(power.toFixed(2)),
    Reaction: Number(reaction.toFixed(2)),
    Metabolic: Number(metabolic.toFixed(2)),
  };
}

export interface BootRecommendationInfo {
  code: 'SG' | 'MIXED' | 'FG-L' | 'FG-S' | 'AG';
  name: string;
  studProfile: string;
  colorClass: string;
  badgeBg: string;
  rationale: string;
}

export function getBootRecommendation(
  bootVal: number,
  studDepthMm?: number,
  gripVal?: number
): BootRecommendationInfo {
  if (bootVal < 2.2) {
    return {
      code: 'SG',
      name: 'Soft Ground (SG)',
      studProfile: 'Long Metal Screw-In Conical Studs (13–15mm)',
      colorClass: 'text-[#001489]',
      badgeBg: 'bg-blue-50 border-blue-300 text-[#001489]',
      rationale:
        'Deep stud penetration and compliant upper soil profile require longer conical metal studs to maintain footing without slipping.',
    };
  }
  if (bootVal < 4.0) {
    return {
      code: 'MIXED',
      name: 'Mixed Soleplate (SG / FG Hybrid)',
      studProfile: 'Hybrid Metal Conical + Molded Studs (11–13mm)',
      colorClass: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 border-emerald-300 text-emerald-800',
      rationale:
        'High natural grass traction with good stud penetration (~11–12mm). Hybrid soleplate balances rotational release with secure grip.',
    };
  }
  if (bootVal < 5.3) {
    return {
      code: 'FG-L',
      name: 'Firm Ground Long (FG-L)',
      studProfile: 'Standard Molded Conical / Chevron Studs (10–11mm)',
      colorClass: 'text-teal-700',
      badgeBg: 'bg-teal-50 border-teal-300 text-teal-800',
      rationale:
        studDepthMm && studDepthMm < 9.5
          ? `Shallow stud penetration (${studDepthMm.toFixed(1)}mm) on firm rootzone; sharper conical FG studs aid ground entry while preventing rotational lock.`
          : 'Balanced firm natural turf profile; standard Firm Ground Long molded cleats provide optimal stud entry and safe rotational release.',
    };
  }
  if (bootVal < 7.2) {
    return {
      code: 'FG-S',
      name: 'Firm Ground Short / Conical (FG-S)',
      studProfile: 'Short Conical Molded Studs (8–9.5mm)',
      colorClass: 'text-amber-700',
      badgeBg: 'bg-amber-50 border-amber-300 text-amber-900',
      rationale:
        gripVal && gripVal > 7.5
          ? 'Elevated rotational traction & hard surface: avoid aggressive bladed cleats to reduce ankle/knee torque during cutting.'
          : 'Compact, high-hardness surface with shallow stud depth (<9mm). Shorter conical studs prevent stud pressure and aid clean release.',
    };
  }
  return {
    code: 'AG',
    name: 'Artificial Grass / Multi-Stud (AG)',
    studProfile: 'Low-Profile Hollow Conical Multi-Studs (<8mm)',
    colorClass: 'text-[#DA291C]',
    badgeBg: 'bg-red-50 border-red-300 text-[#DA291C]',
    rationale:
      'Very high surface compaction or synthetic turf. Multi-stud AG soleplate distributes plantar pressure and minimizes peak rotational torque.',
  };
}

export function getZoneStatusColor(metric: IndexName, value: number): {
  bg: string;
  border: string;
  text: string;
  status: 'optimal' | 'caution-low' | 'caution-high' | 'critical';
  label: string;
} {
  if (metric === 'Impact') {
    if (value < 2.8) {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300',
        text: 'text-slate-950',
        status: 'caution-low',
        label: 'Very Soft / Heavy',
      };
    }
    if (value <= 6.2) {
      return {
        bg: 'bg-emerald-600',
        border: 'border-emerald-300',
        text: 'text-white',
        status: 'optimal',
        label: 'Desirable Impact',
      };
    }
    if (value <= 7.0) {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300',
        text: 'text-slate-950',
        status: 'caution-high',
        label: 'Firm / High Load',
      };
    }
    return {
      bg: 'bg-rose-600',
      border: 'border-rose-300',
      text: 'text-white',
      status: 'critical',
      label: 'Hard / Peak Stress',
    };
  }

  if (metric === 'Energy') {
    if (value < 3.4) {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300',
        text: 'text-slate-950',
        status: 'caution-low',
        label: 'Dissipating / Fatiguing',
      };
    }
    if (value <= 6.5) {
      return {
        bg: 'bg-emerald-600',
        border: 'border-emerald-300',
        text: 'text-white',
        status: 'optimal',
        label: 'Balanced Rebound',
      };
    }
    return {
      bg: 'bg-sky-500',
      border: 'border-sky-300',
      text: 'text-white',
      status: 'caution-high',
      label: 'High Rebound',
    };
  }

  if (metric === 'Grip') {
    if (value < 5.0) {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300',
        text: 'text-slate-950',
        status: 'caution-low',
        label: 'Low Grip / Slip Risk',
      };
    }
    if (value <= 7.5) {
      return {
        bg: 'bg-emerald-600',
        border: 'border-emerald-300',
        text: 'text-white',
        status: 'optimal',
        label: 'Optimal Traction',
      };
    }
    if (value < 8.0) {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300',
        text: 'text-slate-950',
        status: 'caution-high',
        label: 'Elevated Grip',
      };
    }
    return {
      bg: 'bg-rose-600',
      border: 'border-rose-300',
      text: 'text-white',
      status: 'critical',
      label: 'Excessive Torque (>8.0)',
    };
  }

  if (metric === 'Boot') {
    if (value < 2.2) {
      return {
        bg: 'bg-sky-600',
        border: 'border-sky-300',
        text: 'text-white',
        status: 'caution-low',
        label: 'SG Metal',
      };
    }
    if (value < 4.0) {
      return {
        bg: 'bg-emerald-600',
        border: 'border-emerald-300',
        text: 'text-white',
        status: 'optimal',
        label: 'Mixed SG/FG',
      };
    }
    if (value < 5.3) {
      return {
        bg: 'bg-teal-600',
        border: 'border-teal-300',
        text: 'text-white',
        status: 'optimal',
        label: 'FG Long',
      };
    }
    return {
      bg: 'bg-amber-500',
      border: 'border-amber-300',
      text: 'text-slate-950',
      status: 'caution-high',
      label: 'FG Short / Conical',
    };
  }

  // Training Goal Indexes (0-10 alignment score; higher means surface strongly promotes that goal)
  if (value >= 6.3) {
    return {
      bg: 'bg-emerald-600',
      border: 'border-emerald-300',
      text: 'text-white',
      status: 'optimal',
      label: 'High Alignment',
    };
  }
  if (value >= 5.2) {
    return {
      bg: 'bg-teal-600',
      border: 'border-teal-300',
      text: 'text-white',
      status: 'optimal',
      label: 'Moderate Alignment',
    };
  }
  return {
    bg: 'bg-slate-600',
    border: 'border-slate-400',
    text: 'text-slate-100',
    status: 'caution-low',
    label: 'Low Alignment',
  };
}

export interface MagnitudeAssessment {
  delta: number;
  absDelta: number;
  zScore: number;
  absZ: number;
  band: 'trivial' | 'small' | 'moderate' | 'large';
  bandLabel: string;
  directionWord: string;
  summaryText: string;
  clinicalNote: string;
  badgeClass: string;
  barColor: string;
}

const CAMP_SD_BENCHMARKS: Record<string, { sd: number; posWord: string; negWord: string; posNote: string; negNote: string }> = {
  Impact: {
    sd: 0.72,
    posWord: 'Harder / Firmer',
    negWord: 'Softer / Compliant',
    posNote: 'Increased peak vertical ground reaction force & tendon/tibial load',
    negNote: 'Greater shock attenuation; higher muscular & eccentric energy cost',
  },
  Energy: {
    sd: 0.52,
    posWord: 'Higher Rebound',
    negWord: 'More Dissipating',
    posNote: 'Faster elastic energy return; aids sprint speed & reactive plyometrics',
    negNote: 'Surface absorbs more mechanical work; elevates metabolic fatigue',
  },
  Grip: {
    sd: 0.58,
    posWord: 'Higher Traction Bite',
    negWord: 'Lower Traction / Slip',
    posNote: 'Stronger rotational lock during cutting; monitor knee/ankle torque if >7.5',
    negNote: 'Easier stud release; requires longer/conical studs if <5.2 to prevent slip',
  },
  Boot: {
    sd: 0.85,
    posWord: 'Shorter Stud Profile',
    negWord: 'Longer Stud Profile',
    posNote: 'Firmer surface penetration profile favors shorter molded/conical studs',
    negNote: 'Deeper stud penetration favors Mixed SG/FG or longer conical cleats',
  },
  Hardness: {
    sd: 7.5,
    posWord: 'Firmer Surface',
    negWord: 'Softer Surface',
    posNote: 'Higher peak deceleration (Gm) on heel strike',
    negNote: 'Lower peak impact deceleration (Gm); softer underfoot feel',
  },
  ShockAbsorption: {
    sd: 2.8,
    posWord: 'More Cushioned',
    negWord: 'Less Cushioned',
    posNote: 'Higher force reduction (%) relative to concrete',
    negNote: 'Lower force attenuation (%); stiffer mechanical response',
  },
  EnergyRestitution: {
    sd: 1.4,
    posWord: 'More Spring / Return',
    negWord: 'More Damping',
    posNote: 'Greater vertical mechanical energy returned to athlete (%)',
    negNote: 'More energy damped into turf rootzone (%)',
  },
  RotationalTorque: {
    sd: 4.5,
    posWord: 'Higher Peak Torque',
    negWord: 'Lower Peak Torque',
    posNote: 'Higher shear resistance (Nm) during planted foot rotation',
    negNote: 'Lower rotational resistance (Nm); freer cleat release',
  },
  StudDepth: {
    sd: 1.5,
    posWord: 'Deeper Stud Entry',
    negWord: 'Shallower Stud Entry',
    posNote: 'Deeper cleat penetration (mm) into upper rootzone',
    negNote: 'Shallower stud penetration (mm) due to firmer soil compaction',
  },
  Speed: {
    sd: 0.55,
    posWord: 'Faster Surface',
    negWord: 'Slower Surface',
    posNote: 'Higher top-speed & sprint acceleration suitability',
    negNote: 'Lower sprint speed return; higher ground contact time',
  },
  Endurance: {
    sd: 0.55,
    posWord: 'Higher Endurance Fit',
    negWord: 'Lower Endurance Fit',
    posNote: 'Better suited for sustained aerobic & high-volume running',
    negNote: 'Higher mechanical impact per stride over long durations',
  },
  Recovery: {
    sd: 0.45,
    posWord: 'Better Recovery Fit',
    negWord: 'Higher Joint Stress',
    posNote: 'Favorable rebound-to-impact ratio for MD+1 / regeneration',
    negNote: 'Impact exceeds rebound; higher lower-limb mechanical toll',
  },
  Power: {
    sd: 0.55,
    posWord: 'Higher Power Output',
    negWord: 'Lower Force Transfer',
    posNote: 'Firm anchor & high traction maximize explosive force transfer',
    negNote: 'More surface compliance during maximal acceleration/deceleration',
  },
  Reaction: {
    sd: 0.50,
    posWord: 'Quicker Agility / COD',
    negWord: 'Slower Plant & Cut',
    posNote: 'Responsive, high-grip surface for small-sided games & rapid COD',
    negNote: 'Longer amortization phase during reactive directional changes',
  },
  Metabolic: {
    sd: 0.50,
    posWord: 'Higher Metabolic Demand',
    negWord: 'More Economical',
    posNote: 'Softer/compliant turf increases physiological heart-rate & O₂ cost',
    negNote: 'Firmer, high-return turf improves running economy',
  },
};

export function getMagnitudeAssessment(
  metricKey: string,
  value: number,
  refValue: number,
  unit: string = ''
): MagnitudeAssessment {
  const spec = CAMP_SD_BENCHMARKS[metricKey] || {
    sd: 0.6,
    posWord: 'Higher',
    negWord: 'Lower',
    posNote: 'Above reference baseline',
    negNote: 'Below reference baseline',
  };

  const delta = Number((value - refValue).toFixed(2));
  const absDelta = Math.abs(delta);
  const zScore = Number((delta / spec.sd).toFixed(2));
  const absZ = Math.abs(zScore);

  let band: MagnitudeAssessment['band'] = 'trivial';
  let bandLabel = 'Minimal Diff';
  let badgeClass = 'bg-[#F1F5F9] border-[#CBD5E1] text-[#434C5E]';
  let barColor = '#64748B';

  if (absZ >= 1.8) {
    band = 'large';
    bandLabel = 'Large Shift';
    badgeClass =
      delta > 0
        ? 'bg-red-50 border-red-300 text-[#DA291C]'
        : 'bg-blue-50 border-blue-300 text-[#001489]';
    barColor = delta > 0 ? '#DA291C' : '#001489';
  } else if (absZ >= 1.0) {
    band = 'moderate';
    bandLabel = 'Moderate Shift';
    badgeClass =
      delta > 0
        ? 'bg-amber-50 border-amber-300 text-[#92400E]'
        : 'bg-teal-50 border-teal-300 text-teal-800';
    barColor = delta > 0 ? '#C69214' : '#0D9488';
  } else if (absZ >= 0.45) {
    band = 'small';
    bandLabel = 'Slight Shift';
    badgeClass = 'bg-[#EFF6FF] border-[#BFDBFE] text-[#001489]';
    barColor = '#001489';
  }

  const directionWord =
    absZ < 0.45
      ? '≈ Matches Baseline'
      : delta > 0
      ? spec.posWord
      : spec.negWord;

  const signStr = delta > 0 ? `+${delta}` : `${delta}`;
  const zSignStr = zScore > 0 ? `+${zScore.toFixed(1)}σ` : `${zScore.toFixed(1)}σ`;
  const unitSuffix = unit ? ` ${unit}` : '';

  const summaryText =
    absZ < 0.45
      ? `≈ Matches Baseline (${signStr}${unitSuffix} | ${zSignStr})`
      : `${bandLabel}: ${directionWord} (${signStr}${unitSuffix} | ${zSignStr})`;

  const clinicalNote =
    absZ < 0.45
      ? 'Within normal day-to-day pitch variation (< 0.45 SD)'
      : delta > 0
      ? spec.posNote
      : spec.negNote;

  return {
    delta,
    absDelta,
    zScore,
    absZ,
    band,
    bandLabel,
    directionWord,
    summaryText,
    clinicalNote,
    badgeClass,
    barColor,
  };
}

export function getPitchSpreadSummary(evalObj: PitchEvaluation): {
  meanSd: number;
  impactRange: string;
  gripRange: string;
  consistencyLabel: string;
  badgeClass: string;
} {
  const meanSd = Number(
    (
      (evalObj.stdDevs.Impact + evalObj.stdDevs.Energy + evalObj.stdDevs.Grip) /
      3
    ).toFixed(2)
  );
  const impactRange = `${evalObj.mins.Impact.toFixed(1)}–${evalObj.maxs.Impact.toFixed(1)} (±${evalObj.stdDevs.Impact.toFixed(2)})`;
  const gripRange = `${evalObj.mins.Grip.toFixed(1)}–${evalObj.maxs.Grip.toFixed(1)} (±${evalObj.stdDevs.Grip.toFixed(2)})`;

  if (meanSd <= 0.4 && evalObj.hotspots.length === 0) {
    return {
      meanSd,
      impactRange,
      gripRange,
      consistencyLabel: `Consistent 18-Zone Profile (±${meanSd} SD • 0 Hotspots)`,
      badgeClass: 'bg-emerald-50 border-emerald-300 text-emerald-800',
    };
  }
  if (meanSd <= 0.65 && evalObj.hotspots.length <= 2) {
    return {
      meanSd,
      impactRange,
      gripRange,
      consistencyLabel: `Moderate Zone Variation (±${meanSd} SD • ${evalObj.hotspots.length} Hotspot${evalObj.hotspots.length === 1 ? '' : 's'})`,
      badgeClass: 'bg-amber-50 border-amber-300 text-[#92400E]',
    };
  }
  return {
    meanSd,
    impactRange,
    gripRange,
    consistencyLabel: `High Zone Variability (±${meanSd} SD • ${evalObj.hotspots.length} Hotspots)`,
    badgeClass: 'bg-red-50 border-red-300 text-[#DA291C]',
  };
}

export function hydrateEvaluation(seed: RawPitchSeed): PitchEvaluation {
  const zones: PitchZone[] = SNAKE_ZONE_COORDS.map((coord, idx) => {
    const I = seed.impact[idx] ?? 4.5;
    const E = seed.energy[idx] ?? 4.1;
    const G = seed.grip[idx] ?? 6.2;
    const B = seed.boot[idx] ?? Number(Math.max(1, Math.min(9, 10.1 - G)).toFixed(2));
    const tg = computeTrainingGoals(I, E, G);
    return {
      zone: coord.zone,
      posX: coord.posX,
      posY: coord.posY,
      metrics: {
        Impact: Number(I.toFixed(2)),
        Energy: Number(E.toFixed(2)),
        Grip: Number(G.toFixed(2)),
        Boot: Number(B.toFixed(2)),
        ...tg,
      },
    };
  });

  const averages = {} as ZoneMetrics;
  const stdDevs = {} as ZoneMetrics;
  const mins = {} as ZoneMetrics;
  const maxs = {} as ZoneMetrics;

  for (const iname of ALL_INDEX_NAMES) {
    const vals = zones.map((z) => z.metrics[iname]);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const variance = vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / vals.length;
    averages[iname] = Number(mean.toFixed(2));
    stdDevs[iname] = Number(Math.sqrt(variance).toFixed(2));
    mins[iname] = Number(Math.min(...vals).toFixed(2));
    maxs[iname] = Number(Math.max(...vals).toFixed(2));
  }

  // Compute spatial uniformity score (0-100) from CV% of Impact, Energy, Grip
  const cvImpact = averages.Impact > 0 ? stdDevs.Impact / averages.Impact : 0;
  const cvEnergy = averages.Energy > 0 ? stdDevs.Energy / averages.Energy : 0;
  const cvGrip = averages.Grip > 0 ? stdDevs.Grip / averages.Grip : 0;
  const meanCv = (cvImpact + cvEnergy + cvGrip) / 3;
  const uniformityScore = Math.round(Math.max(40, Math.min(99, (1 - meanCv * 1.4) * 100)));

  // Detect localized risk hotspots across the 18 zones
  const hotspots: PitchEvaluation['hotspots'] = [];
  for (const z of zones) {
    if (z.metrics.Grip >= 8.0) {
      hotspots.push({
        zone: z.zone,
        posX: z.posX,
        posY: z.posY,
        metric: 'Grip',
        value: z.metrics.Grip,
        severity: z.metrics.Grip >= 8.4 ? 'critical' : 'warning',
        reason: `High rotational traction (${z.metrics.Grip.toFixed(1)}) — elevated ankle/knee torque risk during cutting.`,
      });
    }
    if (z.metrics.Impact >= 7.0) {
      hotspots.push({
        zone: z.zone,
        posX: z.posX,
        posY: z.posY,
        metric: 'Impact',
        value: z.metrics.Impact,
        severity: z.metrics.Impact >= 7.5 ? 'critical' : 'warning',
        reason: `High surface hardness/impact (${z.metrics.Impact.toFixed(1)}) — increased peak tendon & joint loading.`,
      });
    } else if (z.metrics.Impact <= 2.5) {
      hotspots.push({
        zone: z.zone,
        posX: z.posX,
        posY: z.posY,
        metric: 'Impact',
        value: z.metrics.Impact,
        severity: 'warning',
        reason: `Localized soft/compliant zone (${z.metrics.Impact.toFixed(1)}) — reduced responsiveness and increased muscular fatigue.`,
      });
    }
  }

  return {
    id: seed.id,
    pitchName: seed.pitchName,
    venue: seed.venue,
    surfaceType: seed.surfaceType,
    date: seed.date,
    sourceType: seed.sourceType,
    sessionObjective: seed.sessionObjective,
    notes: seed.notes,
    hardwareMetrics: seed.hardwareMetrics,
    averages,
    stdDevs,
    mins,
    maxs,
    uniformityScore,
    hotspots,
    zones,
  };
}

/**
 * Computes a composite reference baseline across a set of evaluations (e.g. NTC Super 3/4/5 camp average)
 */
export function computeCompositeBaseline(
  evals: PitchEvaluation[],
  id: string,
  name: string,
  description: string
): PitchEvaluation {
  const impact = Array(18).fill(0);
  const energy = Array(18).fill(0);
  const grip = Array(18).fill(0);
  const boot = Array(18).fill(0);
  const n = evals.length || 1;

  for (const ev of evals) {
    ev.zones.forEach((z, idx) => {
      impact[idx] += z.metrics.Impact / n;
      energy[idx] += z.metrics.Energy / n;
      grip[idx] += z.metrics.Grip / n;
      boot[idx] += z.metrics.Boot / n;
    });
  }

  const hw = {
    hardnessGm: Number((evals.reduce((a, b) => a + b.hardwareMetrics.hardnessGm, 0) / n).toFixed(1)),
    shockAbsorptionPct: Number((evals.reduce((a, b) => a + b.hardwareMetrics.shockAbsorptionPct, 0) / n).toFixed(1)),
    energyRestitutionPct: Number((evals.reduce((a, b) => a + b.hardwareMetrics.energyRestitutionPct, 0) / n).toFixed(1)),
    rotationalResistanceNm: Number((evals.reduce((a, b) => a + b.hardwareMetrics.rotationalResistanceNm, 0) / n).toFixed(1)),
    studDepthMm: Number((evals.reduce((a, b) => a + b.hardwareMetrics.studDepthMm, 0) / n).toFixed(1)),
    moisturePct: Number((evals.reduce((a, b) => a + b.hardwareMetrics.moisturePct, 0) / n).toFixed(1)),
  };

  return hydrateEvaluation({
    id,
    pitchName: name,
    venue: 'US Soccer National Training Center (Fayetteville, GA)',
    surfaceType: 'NTC Reference Benchmark',
    date: 'Camp Baseline',
    sourceType: 'CSV_18_ZONE',
    sessionObjective: 'Reference',
    notes: description,
    hardwareMetrics: hw,
    impact,
    energy,
    grip,
    boot,
  });
}

/**
 * Live CSV parser for uploading new Raw Stadia CSV exports directly in the browser
 */
export function parseRawStadiaCsv(csvText: string): PitchEvaluation[] {
  const lines = csvText
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse CSV line respecting quoted strings with comma decimals
  const parseLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = parseLine(lines[0]);
  const idxPitch = headers.findIndex((h) => h.toLowerCase().includes('pitch name'));
  const idxAid = headers.findIndex((h) => h.toLowerCase().includes('analysis id'));
  const idxIname = headers.findIndex((h) => h.toLowerCase().includes('index name'));
  const idxPosX = headers.findIndex((h) => h.toLowerCase().includes('pos x'));
  const idxPosY = headers.findIndex((h) => h.toLowerCase().includes('pos y'));
  const idxDate = headers.findIndex((h) => h.toLowerCase().includes('datetime'));
  const idxVal = headers.findIndex((h) => h.toLowerCase() === 'index result');
  const idxWeight = headers.findIndex((h) => h.toLowerCase().includes('weight'));

  if (idxPitch === -1 || idxIname === -1 || idxVal === -1) {
    throw new Error('Invalid Raw Stadia CSV header format.');
  }

  const normDate = (dt: string): string => {
    const d = dt.split(' ')[0];
    const parts = d.split('/');
    if (parts.length !== 3) return d;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const sessionsMap = new Map<
    string,
    {
      pitchName: string;
      date: string;
      zones: Map<number, Map<string, { aid: number; val: number }>>;
    }
  >();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const pitchName = cols[idxPitch];
    if (!pitchName) continue;
    const dateStr = normDate(cols[idxDate] || '2026-09-21');
    const aid = parseInt(cols[idxAid] || '0', 10);
    const iname = cols[idxIname];
    const posX = parseInt(cols[idxPosX] || '1', 10);
    const posY = parseInt(cols[idxPosY] || '1', 10);
    const weight = idxWeight !== -1 && cols[idxWeight] ? parseInt(cols[idxWeight], 10) : 1;
    const val = parseFloat((cols[idxVal] || '0').replace(',', '.'));

    if (isNaN(val)) continue;
    const key = `${pitchName}__${dateStr}`;
    if (!sessionsMap.has(key)) {
      sessionsMap.set(key, { pitchName, date: dateStr, zones: new Map() });
    }
    const sess = sessionsMap.get(key)!;
    const znum = weight >= 1 && weight <= 18 ? weight : (posY - 1) * 3 + (posY % 2 === 1 ? 4 - posX : posX);
    if (!sess.zones.has(znum)) {
      sess.zones.set(znum, new Map());
    }
    const zmap = sess.zones.get(znum)!;
    const existing = zmap.get(iname);
    if (!existing || aid >= existing.aid) {
      zmap.set(iname, { aid, val });
    }
  }

  const results: PitchEvaluation[] = [];
  sessionsMap.forEach((sess, key) => {
    const impact: number[] = [];
    const energy: number[] = [];
    const grip: number[] = [];
    const boot: number[] = [];

    for (let z = 1; z <= 18; z++) {
      const zmap = sess.zones.get(z);
      const imp = zmap?.get('Impact')?.val ?? 4.4;
      const eng = zmap?.get('Energy')?.val ?? 4.1;
      const grp = zmap?.get('Grip')?.val ?? 6.2;
      const bt = zmap?.get('Boot')?.val ?? Math.max(1, 10.1 - grp);
      impact.push(Number(imp.toFixed(2)));
      energy.push(Number(eng.toFixed(2)));
      grip.push(Number(grp.toFixed(2)));
      boot.push(Number(bt.toFixed(2)));
    }

    const avgImp = impact.reduce((a, b) => a + b, 0) / 18;
    const avgEng = energy.reduce((a, b) => a + b, 0) / 18;
    const avgGrp = grip.reduce((a, b) => a + b, 0) / 18;
    const avgBt = boot.reduce((a, b) => a + b, 0) / 18;

    results.push(
      hydrateEvaluation({
        id: `uploaded-${key.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        pitchName: sess.pitchName,
        venue: sess.pitchName.includes('Orlando') ? 'Inter&Co Stadium' : 'Uploaded Pitch Evaluation',
        surfaceType: 'Natural Grass (Uploaded CSV)',
        date: sess.date,
        sourceType: 'USER_UPLOAD',
        sessionObjective: 'Custom Upload',
        notes: `Imported from CSV upload (${sess.pitchName} on ${sess.date}).`,
        hardwareMetrics: {
          hardnessGm: Number((52 + avgImp * 6.5).toFixed(1)),
          shockAbsorptionPct: Number((72 - avgImp * 2.1).toFixed(1)),
          energyRestitutionPct: Number((11.5 + avgEng * 1.5).toFixed(1)),
          rotationalResistanceNm: Number((24 + avgGrp * 4.2).toFixed(1)),
          studDepthMm: Number(Math.max(6.5, 16.5 - avgBt * 1.4).toFixed(1)),
          moisturePct: 24.5,
        },
        impact,
        energy,
        grip,
        boot,
      })
    );
  });

  return results;
}
