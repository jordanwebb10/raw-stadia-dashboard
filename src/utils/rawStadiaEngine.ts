import {
  IndexName,
  MetricReferenceStats,
  PitchEvaluation,
  PitchHotspot,
  PitchStatSummary,
  PitchZone,
  RawPitchSeed,
  ReferenceBaselineProfile,
  ReferenceModeId,
} from '../types/rawStadia';

export const CORE_INDEX_NAMES: IndexName[] = ['Impact', 'Energy', 'Grip'];

export interface JoseReportScaleBandSpec {
  metric: IndexName;
  outerLow: [number, number];
  marginalLow: [number, number];
  desirableGauge: [number, number];
  desirableZoneMap: [number, number];
  marginalHigh: [number, number];
  outerHigh: [number, number];
  segmentWidthsPct: [number, number, number, number, number];
  zoneLowAlertCutoff: number;
  zoneHighAlertCutoff: number;
  emailEvidenceSummary: string;
}

/**
 * Exact 5-tier hard reference ranges extracted from José María Oliva Lozano's
 * USMNT Field Status Reports:
 * - Visual 0–10 gauge bars measured pixel-for-pixel from `data/reference/media_7.png`
 *   (193 px total bar width = 19.3 px per 1.0 index unit)
 * - Cross-referenced against Jose's 10 raw HTML email bodies (`data/raw-emails/*.html`)
 */
export const JOSE_REPORT_SCALE_BANDS: Record<IndexName, JoseReportScaleBandSpec> = {
  Impact: {
    metric: 'Impact',
    outerLow: [0.0, 2.0],
    marginalLow: [2.0, 3.5],
    desirableGauge: [3.5, 6.5],
    desirableZoneMap: [3.5, 6.5],
    marginalHigh: [6.5, 8.0],
    outerHigh: [8.0, 10.0],
    segmentWidthsPct: [20, 15, 30, 15, 20],
    zoneLowAlertCutoff: 2.0,
    zoneHighAlertCutoff: 7.0,
    emailEvidenceSummary:
      'Gauge green band: 3.5–6.5. Emails flag ~2.0 & 1.8 in Orlando as localized low values, 3.6–3.7 as relatively low overall, 4.0–5.0 at NTC as appropriate, and 7.7–8.3 (AZ, MN, STL) as outside recommended ranges.',
  },
  Energy: {
    metric: 'Energy',
    outerLow: [0.0, 2.0],
    marginalLow: [2.0, 3.5],
    desirableGauge: [3.5, 6.5],
    desirableZoneMap: [3.5, 6.5],
    marginalHigh: [6.5, 8.0],
    outerHigh: [8.0, 10.0],
    segmentWidthsPct: [20, 15, 30, 15, 20],
    zoneLowAlertCutoff: 3.5,
    zoneHighAlertCutoff: 6.5,
    emailEvidenceSummary:
      'Gauge green band: 3.5–6.5. Emails report 3.9–4.3 across all 10 camp sessions as consistent and within the green desirable band.',
  },
  Grip: {
    metric: 'Grip',
    outerLow: [0.0, 3.0],
    marginalLow: [3.0, 4.5],
    desirableGauge: [4.5, 8.5],
    desirableZoneMap: [4.5, 7.9],
    marginalHigh: [8.5, 9.0],
    outerHigh: [9.0, 10.0],
    segmentWidthsPct: [30, 15, 40, 5, 10],
    zoneLowAlertCutoff: 4.5,
    zoneHighAlertCutoff: 8.0,
    emailEvidenceSummary:
      'Gauge green band: 4.5–8.5 (30%/15%/40%/5%/10% bar split). On the 18-zone pitch map, zones ≥ 8.0 turn Red (#C62828) (e.g., 8.1 in Orlando, 8.0 in Super 4, 8.2 in Super 5 flagged in Jose’s emails).',
  },
};

export const REFERENCE_MODE_OPTIONS: {
  id: ReferenceModeId;
  label: string;
  shortLabel: string;
}[] = [
  {
    id: 'raw-stadia-scale',
    label: "Jose's Report Hard Reference Ranges (0–10 Gauge Bands)",
    shortLabel: 'Jose Report Bands (3.5–6.5 / 4.5–8.0)',
  },
  {
    id: 'ntc-baseline',
    label: 'NTC Training Baseline (Empirical Mean ± 1 SD)',
    shortLabel: 'NTC Baseline (±1 SD)',
  },
  {
    id: 'all-camp',
    label: 'Full Camp Distribution (Empirical Mean ± 1 SD)',
    shortLabel: 'All-Camp (±1 SD)',
  },
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

export function calcMean(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function calcSd(vals: number[]): number {
  if (vals.length <= 1) return 0;
  const m = calcMean(vals);
  const variance = vals.reduce((acc, v) => acc + (v - m) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
}

export function hydrateEvaluation(seed: RawPitchSeed): PitchEvaluation {
  const zones: PitchZone[] = SNAKE_ZONE_COORDS.map((coord, idx) => {
    const I = seed.impact[idx] ?? 4.5;
    const E = seed.energy[idx] ?? 4.1;
    const G = seed.grip[idx] ?? 6.2;
    return {
      zone: coord.zone,
      posX: coord.posX,
      posY: coord.posY,
      metrics: {
        Impact: Number(I.toFixed(2)),
        Energy: Number(E.toFixed(2)),
        Grip: Number(G.toFixed(2)),
      },
    };
  });

  const averages = {} as Record<IndexName, number>;
  const stats = {} as Record<IndexName, PitchStatSummary>;
  const stdDevs = {} as Record<IndexName, number>;
  const mins = {} as Record<IndexName, number>;
  const maxs = {} as Record<IndexName, number>;

  for (const iname of CORE_INDEX_NAMES) {
    const vals = zones.map((z) => z.metrics[iname]);
    const mean = Number(calcMean(vals).toFixed(2));
    const sd = Number(calcSd(vals).toFixed(2));
    const min = Number(Math.min(...vals).toFixed(2));
    const max = Number(Math.max(...vals).toFixed(2));
    averages[iname] = mean;
    stdDevs[iname] = sd;
    mins[iname] = min;
    maxs[iname] = max;
    stats[iname] = { mean, sd, min, max };
  }

  // Compute uniformity score (0-100) from average zone SD across Impact, Energy, Grip
  const meanSd = (stdDevs.Impact + stdDevs.Energy + stdDevs.Grip) / 3;
  const uniformityScore = Math.max(55, Math.min(99, Math.round(100 - meanSd * 22)));

  // Detect localized zone outliers using Jose's report thresholds across Impact, Energy, Grip
  const hotspots: PitchHotspot[] = [];
  for (const z of zones) {
    if (z.metrics.Grip >= 8.0) {
      hotspots.push({
        zone: z.zone,
        posX: z.posX,
        posY: z.posY,
        metric: 'Grip',
        value: z.metrics.Grip,
        severity: 'critical',
        reason: `High Traction Field zone (Grip ${z.metrics.Grip.toFixed(1)} ≥ 8.0 report cutoff) • Suggested Watch: Ankle | Knee`,
      });
    } else if (z.metrics.Grip < 4.5) {
      hotspots.push({
        zone: z.zone,
        posX: z.posX,
        posY: z.posY,
        metric: 'Grip',
        value: z.metrics.Grip,
        severity: 'caution',
        reason: `Low Traction Field zone (Grip ${z.metrics.Grip.toFixed(1)} < 4.5 report band) • Suggested Watch: Groin | Slipping`,
      });
    }

    if (z.metrics.Impact >= 7.0) {
      hotspots.push({
        zone: z.zone,
        posX: z.posX,
        posY: z.posY,
        metric: 'Impact',
        value: z.metrics.Impact,
        severity: 'critical',
        reason: `Hard Field zone (Impact ${z.metrics.Impact.toFixed(1)} outside 3.5–6.5 report band) • Suggested Watch: Tendons | Joints`,
      });
    } else if (z.metrics.Impact <= 2.3) {
      hotspots.push({
        zone: z.zone,
        posX: z.posX,
        posY: z.posY,
        metric: 'Impact',
        value: z.metrics.Impact,
        severity: 'critical',
        reason: `Soft Field zone (Impact ${z.metrics.Impact.toFixed(1)} near ≤ 2.0 report outer band) • Suggested Watch: Muscles | Ligaments`,
      });
    }

    if (z.metrics.Energy < 3.5) {
      hotspots.push({
        zone: z.zone,
        posX: z.posX,
        posY: z.posY,
        metric: 'Energy',
        value: z.metrics.Energy,
        severity: 'caution',
        reason: `Dissipating Field zone (Energy ${z.metrics.Energy.toFixed(1)} < 3.5 report band) • Suggested Watch: Calves | Cramps`,
      });
    }
  }

  return {
    id: seed.id,
    pitchName: seed.pitchName,
    venue: seed.venue,
    surfaceType: seed.surfaceType,
    date: seed.date,
    datetimeDisplay: seed.date,
    analysisId: seed.analysisId,
    sourceType: seed.sourceType,
    sessionObjective: seed.sessionObjective,
    notes: seed.notes,
    averages,
    stats,
    stdDevs,
    mins,
    maxs,
    uniformityScore,
    hotspots,
    zones,
  };
}

function buildCompositeZones(evals: PitchEvaluation[]): PitchZone[] {
  const n = evals.length || 1;
  return SNAKE_ZONE_COORDS.map((coord, idx) => {
    const imp = evals.reduce((acc, e) => acc + (e.zones[idx]?.metrics.Impact ?? 4.5), 0) / n;
    const eng = evals.reduce((acc, e) => acc + (e.zones[idx]?.metrics.Energy ?? 4.0), 0) / n;
    const grp = evals.reduce((acc, e) => acc + (e.zones[idx]?.metrics.Grip ?? 6.2), 0) / n;
    return {
      zone: coord.zone,
      posX: coord.posX,
      posY: coord.posY,
      metrics: {
        Impact: Number(imp.toFixed(2)),
        Energy: Number(eng.toFixed(2)),
        Grip: Number(grp.toFixed(2)),
      },
    };
  });
}

function computeEmpiricalMetricStats(
  evals: PitchEvaluation[],
  metric: IndexName
): MetricReferenceStats {
  const allZoneVals = evals.flatMap((e) => e.zones.map((z) => z.metrics[metric]));
  const mean = Number(calcMean(allZoneVals).toFixed(2));
  const sd = Math.max(0.25, Number(calcSd(allZoneVals).toFixed(2)));
  const bandMin = Number(Math.max(0, mean - sd).toFixed(2));
  const bandMax = Number(Math.min(10, mean + sd).toFixed(2));
  const min = Number(Math.min(...allZoneVals).toFixed(2));
  const max = Number(Math.max(...allZoneVals).toFixed(2));
  return {
    mean,
    sd,
    bandMin,
    bandMax,
    bandLow: bandMin,
    bandHigh: bandMax,
    min,
    max,
  };
}

/**
 * Builds a transparent, data-driven Reference Baseline Profile (REF + Reference Range Band)
 */
export function buildReferenceBaselineProfile(
  modeId: ReferenceModeId,
  evaluations: PitchEvaluation[]
): ReferenceBaselineProfile {
  const ntcEvals = evaluations.filter(
    (e) => e.pitchName.startsWith('USSF Super') && e.date >= '2026-09-21'
  );
  const effectiveNtc = ntcEvals.length > 0 ? ntcEvals : evaluations;

  if (modeId === 'ntc-baseline') {
    return {
      id: 'ntc-baseline',
      label: 'NTC Training Baseline (Mean ± 1 SD)',
      shortLabel: 'NTC Baseline (±1 SD)',
      description: `Computed directly from all ${effectiveNtc.length} NTC training evaluations (${effectiveNtc.length * 18} zone measurements across USSF Super 3, 4, and 5).`,
      formulaNote: 'REF = NTC Mean | Green Reference Band = NTC Mean ± 1 SD',
      metrics: {
        Impact: computeEmpiricalMetricStats(effectiveNtc, 'Impact'),
        Energy: computeEmpiricalMetricStats(effectiveNtc, 'Energy'),
        Grip: computeEmpiricalMetricStats(effectiveNtc, 'Grip'),
      },
      zones: buildCompositeZones(effectiveNtc),
    };
  }

  if (modeId === 'all-camp') {
    return {
      id: 'all-camp',
      label: 'Full Camp Distribution (Mean ± 1 SD)',
      shortLabel: 'All-Camp (±1 SD)',
      description: `Computed directly across all ${evaluations.length} camp evaluations (${evaluations.length * 18} total zone measurements).`,
      formulaNote: 'REF = All-Camp Mean | Green Reference Band = All-Camp Mean ± 1 SD',
      metrics: {
        Impact: computeEmpiricalMetricStats(evaluations, 'Impact'),
        Energy: computeEmpiricalMetricStats(evaluations, 'Energy'),
        Grip: computeEmpiricalMetricStats(evaluations, 'Grip'),
      },
      zones: buildCompositeZones(evaluations),
    };
  }

  if (modeId === 'raw-stadia-scale') {
    return {
      id: 'raw-stadia-scale',
      label: "Jose's Report Hard Reference Ranges (0–10 Gauge Bands)",
      shortLabel: 'Jose Report Bands',
      description:
        "Extracted from José María Oliva Lozano's USMNT Field Status Report gauges (media_7.png) and 10 HTML emails: Impact 3.5–6.5, Energy 3.5–6.5, and Grip 4.5–8.0 (gauge green 4.5–8.5, with zones ≥ 8.0 flagged red).",
      formulaNote:
        'Impact & Energy: 0–2.0 | 2.0–3.5 | 3.5–6.5 (Green) | 6.5–8.0 | 8.0–10.0 • Grip: 0–3.0 | 3.0–4.5 | 4.5–8.0 (Green, ≥8.0 Red Alert)',
      metrics: {
        Impact: {
          mean: 5.0,
          sd: 1.5,
          bandMin: 3.5,
          bandMax: 6.5,
          bandLow: 2.0,
          bandHigh: 8.0,
          min: 0,
          max: 10,
        },
        Energy: {
          mean: 5.0,
          sd: 1.5,
          bandMin: 3.5,
          bandMax: 6.5,
          bandLow: 2.0,
          bandHigh: 8.0,
          min: 0,
          max: 10,
        },
        Grip: {
          mean: 6.25,
          sd: 1.75,
          bandMin: 4.5,
          bandMax: 8.0,
          bandLow: 3.0,
          bandHigh: 8.5,
          min: 0,
          max: 10,
        },
      },
      zones: buildCompositeZones(effectiveNtc),
    };
  }

  // Otherwise modeId is a specific PitchEvaluation ID
  const targetPitch = evaluations.find((e) => e.id === modeId) || effectiveNtc[0] || evaluations[0];
  return {
    id: targetPitch.id,
    label: `${targetPitch.pitchName} (${targetPitch.date})`,
    shortLabel: `${targetPitch.pitchName} (${targetPitch.date.slice(5)})`,
    description: `Single-pitch reference using the 18 zones of ${targetPitch.pitchName} on ${targetPitch.date} (Mean ± 1 SD).`,
    formulaNote: 'REF = Pitch Mean | Green Band = Pitch 18-Zone Mean ± 1 SD',
    metrics: {
      Impact: computeEmpiricalMetricStats([targetPitch], 'Impact'),
      Energy: computeEmpiricalMetricStats([targetPitch], 'Energy'),
      Grip: computeEmpiricalMetricStats([targetPitch], 'Grip'),
    },
    zones: targetPitch.zones,
  };
}

/**
 * Evaluates a zone or pitch value against the active Reference Range and Jose's report cutoffs
 */
export function getZoneStatusColor(
  metric: IndexName,
  value: number,
  refStats?: MetricReferenceStats
): {
  bg: string;
  border: string;
  text: string;
  status: 'optimal' | 'caution-low' | 'caution-high' | 'critical';
  label: string;
} {
  if (metric === 'Impact') {
    const lowCut = refStats ? refStats.bandMin : 3.5;
    const highCut = refStats ? refStats.bandMax : 6.5;
    if (value <= 2.0) {
      return {
        bg: 'bg-[#DA291C]',
        border: 'border-red-300',
        text: 'text-white',
        status: 'critical',
        label: 'Soft Field (≤ 2.0)',
      };
    }
    if (value < lowCut) {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300',
        text: 'text-slate-950',
        status: 'caution-low',
        label: 'Below Recommended Band',
      };
    }
    if (value <= highCut) {
      return {
        bg: 'bg-emerald-600',
        border: 'border-emerald-300',
        text: 'text-white',
        status: 'optimal',
        label: 'Within Recommended Band',
      };
    }
    if (value < 7.0) {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300',
        text: 'text-slate-950',
        status: 'caution-high',
        label: 'Above Recommended Band',
      };
    }
    return {
      bg: 'bg-[#DA291C]',
      border: 'border-red-300',
      text: 'text-white',
      status: 'critical',
      label: 'Hard Field (≥ 7.0)',
    };
  }

  if (metric === 'Energy') {
    const lowCut = refStats ? refStats.bandMin : 3.5;
    const highCut = refStats ? refStats.bandMax : 6.5;
    if (value < 2.0) {
      return {
        bg: 'bg-[#DA291C]',
        border: 'border-red-300',
        text: 'text-white',
        status: 'critical',
        label: 'Very Low Energy (< 2.0)',
      };
    }
    if (value < lowCut) {
      return {
        bg: 'bg-amber-500',
        border: 'border-amber-300',
        text: 'text-slate-950',
        status: 'caution-low',
        label: 'Dissipating Field',
      };
    }
    if (value <= highCut) {
      return {
        bg: 'bg-emerald-600',
        border: 'border-emerald-300',
        text: 'text-white',
        status: 'optimal',
        label: 'Within Recommended Band',
      };
    }
    return {
      bg: 'bg-teal-600',
      border: 'border-teal-300',
      text: 'text-white',
      status: 'caution-high',
      label: 'Rebounding Field',
    };
  }

  // Grip: Jose's report shows 4.5-8.5 green on gauge bar, and >= 8.0 as Red (#C62828) on the 18-zone pitch map
  const lowCut = refStats ? refStats.bandMin : 4.5;
  const highCut = refStats ? Math.min(refStats.bandMax, 7.99) : 7.99;
  if (value >= 8.0) {
    return {
      bg: 'bg-[#DA291C]',
      border: 'border-red-300',
      text: 'text-white',
      status: 'critical',
      label: 'High Traction Alert (≥ 8.0)',
    };
  }
  if (value < 3.0) {
    return {
      bg: 'bg-[#DA291C]',
      border: 'border-red-300',
      text: 'text-white',
      status: 'critical',
      label: 'Very Low Grip (< 3.0)',
    };
  }
  if (value < lowCut) {
    return {
      bg: 'bg-amber-500',
      border: 'border-amber-300',
      text: 'text-slate-950',
      status: 'caution-low',
      label: 'Low Traction Field',
    };
  }
  if (value <= highCut) {
    return {
      bg: 'bg-emerald-600',
      border: 'border-emerald-300',
      text: 'text-white',
      status: 'optimal',
      label: 'Within Recommended Band',
    };
  }
  return {
    bg: 'bg-amber-500',
    border: 'border-amber-300',
    text: 'text-slate-950',
    status: 'caution-high',
    label: 'High Traction Field',
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

const METRIC_DIRECTION_SPECS: Record<
  IndexName,
  { defaultSd: number; posWord: string; negWord: string; posNote: string; negNote: string }
> = {
  Impact: {
    defaultSd: 0.68,
    posWord: 'Harder Field',
    negWord: 'Softer Field',
    posNote:
      'PDF Spectrum: Shifts toward Hard Field (Increased Mechanical Load • Tendons | Joints watch)',
    negNote:
      'PDF Spectrum: Shifts toward Soft Field (Reduced Mechanical Load • Muscles | Ligaments watch)',
  },
  Energy: {
    defaultSd: 0.38,
    posWord: 'More Rebounding',
    negWord: 'More Dissipating',
    posNote:
      'PDF Spectrum: Shifts toward Rebounding Field (Reduced Physiological Load • High Paced Game)',
    negNote:
      'PDF Spectrum: Shifts toward Dissipating Field (Increased Physiological Load • Calves | Cramps watch)',
  },
  Grip: {
    defaultSd: 0.89,
    posWord: 'Higher Traction',
    negWord: 'Lower Traction',
    posNote:
      'PDF Spectrum: Shifts toward High Traction Field (Increased Explosiveness • Ankle | Knee watch)',
    negNote:
      'PDF Spectrum: Shifts toward Low Traction Field (Increased Metabolic Load • Groin | Slipping watch)',
  },
};

export function getMagnitudeAssessment(
  metric: IndexName,
  value: number,
  refValue: number,
  empiricalSd?: number
): MagnitudeAssessment {
  const spec = METRIC_DIRECTION_SPECS[metric];
  const sdToUse = empiricalSd && empiricalSd > 0.15 ? empiricalSd : spec.defaultSd;

  const delta = Number((value - refValue).toFixed(2));
  const absDelta = Math.abs(delta);
  const zScore = Number((delta / sdToUse).toFixed(2));
  const absZ = Math.abs(zScore);

  let band: MagnitudeAssessment['band'] = 'trivial';
  let bandLabel = 'Minimal Diff';
  let badgeClass = 'bg-[#F1F5F9] border-[#CBD5E1] text-[#434C5E]';
  let barColor = '#64748B';

  if (absZ >= 1.2) {
    band = 'large';
    bandLabel = 'Large Shift';
    badgeClass =
      delta > 0
        ? 'bg-red-50 border-red-300 text-[#DA291C]'
        : 'bg-blue-50 border-blue-300 text-[#001489]';
    barColor = delta > 0 ? '#DA291C' : '#001489';
  } else if (absZ >= 0.6) {
    band = 'moderate';
    bandLabel = 'Moderate Shift';
    badgeClass =
      delta > 0
        ? 'bg-amber-50 border-amber-300 text-[#92400E]'
        : 'bg-teal-50 border-teal-300 text-teal-800';
    barColor = delta > 0 ? '#C69214' : '#0D9488';
  } else if (absZ >= 0.25) {
    band = 'small';
    bandLabel = 'Small Shift';
    badgeClass = 'bg-[#EFF6FF] border-[#BFDBFE] text-[#001489]';
    barColor = '#001489';
  }

  const directionWord =
    absZ < 0.25 ? '≈ Matches Reference' : delta > 0 ? spec.posWord : spec.negWord;

  const signStr = delta > 0 ? `+${delta.toFixed(2)}` : `${delta.toFixed(2)}`;
  const zSignStr = zScore > 0 ? `+${zScore.toFixed(1)}σ` : `${zScore.toFixed(1)}σ`;

  const summaryText =
    absZ < 0.25
      ? `≈ Matches (${signStr} | ${zSignStr})`
      : `${bandLabel}: ${directionWord} (${signStr} | ${zSignStr})`;

  const clinicalNote =
    absZ < 0.25
      ? 'Within normal 18-zone pitch variation (< 0.25 SD)'
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
  consistencyLabel: string;
  badgeClass: string;
} {
  if (evalObj.uniformityScore >= 85) {
    return {
      consistencyLabel: 'High Zone Consistency',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }
  if (evalObj.uniformityScore >= 75) {
    return {
      consistencyLabel: 'Moderate Zone Spread',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }
  return {
    consistencyLabel: 'Wide 18-Zone Variance',
    badgeClass: 'bg-red-50 text-[#DA291C] border-red-200',
  };
}

/**
 * Parses a Raw Stadia 18-Zone CSV export into PitchEvaluation objects (Impact, Energy, Grip)
 */
export function parseRawStadiaCsv(csvText: string): PitchEvaluation[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const pitchIdx = header.findIndex((h) => h.includes('pitch'));
  const dateIdx = header.findIndex((h) => h.includes('date'));
  const zoneIdx = header.findIndex((h) => h === 'zone');
  const indexNameIdx = header.findIndex((h) => h.includes('index name') || h === 'metric');
  const valIdx = header.findIndex((h) => h.includes('index value') || h === 'value');

  if (pitchIdx === -1 || dateIdx === -1 || zoneIdx === -1 || indexNameIdx === -1 || valIdx === -1) {
    return [];
  }

  const grouped = new Map<
    string,
    {
      pitchName: string;
      date: string;
      impact: number[];
      energy: number[];
      grip: number[];
    }
  >();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim());
    const pitchName = cols[pitchIdx] || 'Imported Pitch';
    const rawDate = (cols[dateIdx] || '').slice(0, 10);
    const zoneNum = parseInt(cols[zoneIdx] || '0', 10);
    const metricRaw = (cols[indexNameIdx] || '').toLowerCase();
    const val = parseFloat(cols[valIdx] || '0');

    if (!zoneNum || zoneNum < 1 || zoneNum > 18 || isNaN(val)) continue;
    const key = `${pitchName}__${rawDate}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        pitchName,
        date: rawDate || '2026-10-01',
        impact: Array(18).fill(4.5),
        energy: Array(18).fill(4.0),
        grip: Array(18).fill(6.2),
      });
    }
    const entry = grouped.get(key)!;
    if (metricRaw === 'impact') entry.impact[zoneNum - 1] = val;
    else if (metricRaw === 'energy') entry.energy[zoneNum - 1] = val;
    else if (metricRaw === 'grip') entry.grip[zoneNum - 1] = val;
  }

  const results: PitchEvaluation[] = [];
  grouped.forEach((g) => {
    const id = `${g.pitchName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${g.date}`;
    results.push(
      hydrateEvaluation({
        id,
        pitchName: g.pitchName,
        venue: 'Imported Raw Stadia Session',
        surfaceType: 'Natural Grass',
        date: g.date,
        sourceType: 'CSV_18_ZONE',
        sessionObjective: 'Baseline',
        notes: `Imported 18-zone Raw Stadia evaluation for ${g.pitchName} (${g.date}).`,
        impact: g.impact,
        energy: g.energy,
        grip: g.grip,
      })
    );
  });

  return results;
}
