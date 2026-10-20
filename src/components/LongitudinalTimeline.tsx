import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Footprints,
  Layers,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { IndexName, PitchEvaluation } from '../types/rawStadia';
import { getBootRecommendation } from '../utils/rawStadiaEngine';
import { MetricInfoTrigger } from './AppendixAModal';

export type ProgressionMetricKey = IndexName | 'Hardness' | 'StudDepth' | 'RotationalTorque';

export type ClinicalLensId =
  | 'patellar_achilles'
  | 'muscular_fatigue'
  | 'joint_torque'
  | 'groin_adductor'
  | 'general';

interface ClinicalLensSpec {
  id: ClinicalLensId;
  title: string;
  shortBadge: string;
  defaultMetric: ProgressionMetricKey;
  pathologyFocus: string;
  mechanismSummary: string;
  managementGuidance: string;
}

const CLINICAL_LENSES: ClinicalLensSpec[] = [
  {
    id: 'patellar_achilles',
    title: 'Patellar & Achilles Tendinopathy',
    shortBadge: 'Tendon Load & Stiffness Shock',
    defaultMetric: 'Impact',
    pathologyFocus: 'Patellar tendinosis, Achilles tendinopathy, tibial stress, anterior knee pain',
    mechanismSummary:
      'Elevated surface firmness (Impact > 6.0, Hardness > 85 Gm), abrupt soft-to-hard day-to-day transitions (Δ Impact ≥ +0.8), and high within-pitch variance (SD ≥ 0.65) increase peak vertical ground reaction force (vGRF) braking impulse and patellar tendon tensile/compressive strain rate during deceleration.',
    managementGuidance:
      'Monitor high-minute & tendinopathy-managed players during rapid upward Impact transitions (+0.8 or greater) and when 18-zone SD exceeds ±0.65. Prioritize cushioned midsoles/FG-S conical studs on firm pitches (> 85 Gm) and adjust deceleration/plyometric volume on MD-1/MD+1.',
  },
  {
    id: 'muscular_fatigue',
    title: 'Calf / Hamstring Tightness & Eccentric Fatigue',
    shortBadge: 'Soft / Dissipating Turf Work',
    defaultMetric: 'Energy',
    pathologyFocus: 'Soleus/gastrocnemius tightness, hamstring eccentric overload, metabolic fatigue',
    mechanismSummary:
      'Compliant, energy-dissipating surfaces (Impact < 3.8 or Energy < 3.8) deform excessively under foot strike, increasing ground contact time and requiring greater concentric and eccentric muscle-tendon work for every stride.',
    managementGuidance:
      'When camp sessions dip below the Ideal Range (Impact < 4.0 or Energy < 3.8) or exhibit localized soft zones (≤ 2.5), account for elevated internal physiological load relative to GPS external distance.',
  },
  {
    id: 'joint_torque',
    title: 'Knee & Ankle Rotational Stress',
    shortBadge: 'Stud Fixation & Peak Torque',
    defaultMetric: 'Grip',
    pathologyFocus: 'Syndesmosis/ankle torque, meniscal/collateral knee stress, forefoot stud lock',
    mechanismSummary:
      'Excessive rotational traction (Grip > 7.2 mean or localized zone spikes ≥ 8.0, Rotational Torque > 52 Nm) prevents natural cleat release during cutting and pivoting, transmitting high torsional moments to the ankle and knee.',
    managementGuidance:
      'Avoid aggressive bladed or long metal studs when Grip exceeds 7.2 or when localized central/box zones reach ≥ 8.0. Recommend conical Firm Ground (FG-S / FG-L) outsoles to facilitate cleaner rotational release.',
  },
  {
    id: 'groin_adductor',
    title: 'Adductor / Groin Shear & Slip Risk',
    shortBadge: 'Shallow Penetration & Slip',
    defaultMetric: 'StudDepth',
    pathologyFocus: 'Adductor longus strain, hip flexor irritation, lateral cut micro-slipping',
    mechanismSummary:
      'Compact rootzones or newly laid sod with shallow stud penetration (< 9.5 mm) or low shear traction (Grip < 5.5) reduce lateral purchase during high-velocity cutting, triggering rapid eccentric adductor stabilization.',
    managementGuidance:
      'When Stud Penetration Depth drops below 9.5 mm on firm turf, avoid long wide studs that sit on top of the surface ("skating" effect); transition to sharper conical FG-S studs for reliable penetration.',
  },
  {
    id: 'general',
    title: 'All-Metric Longitudinal Overview',
    shortBadge: 'General Surface Progression',
    defaultMetric: 'Impact',
    pathologyFocus: 'Complete multi-parameter camp surface audit across all 0–10 indices & RAA/RTT sensors',
    mechanismSummary:
      'Tracks chronological team surface exposure (Mean ± 1 SD and 18-zone Min–Max spread) against the Ideal Range and reference benchmark across the selected date window.',
    managementGuidance:
      'Select any surface index or physical sensor below to inspect day-over-day shifts, spatial variance ribbons, and footwear alignment.',
  },
];

interface MetricChartConfig {
  key: ProgressionMetricKey;
  label: string;
  shortLabel: string;
  unit: string;
  yMin: number;
  yMax: number;
  idealMin: number;
  idealMax: number;
  idealLabel: string;
  highZoneLabel: string;
  lowZoneLabel: string;
  significantShiftThreshold: number;
  highSdThreshold: number;
  appendixKey: string;
}

const METRIC_CONFIGS: Record<ProgressionMetricKey, MetricChartConfig> = {
  Impact: {
    key: 'Impact',
    label: 'Impact Index (0–10)',
    shortLabel: 'Impact',
    unit: '/10',
    yMin: 1.5,
    yMax: 8.5,
    idealMin: 4.0,
    idealMax: 6.0,
    idealLabel: 'Ideal Range: 4.0 – 6.0',
    highZoneLabel: 'High Stiffness / Tendon Load (> 6.0)',
    lowZoneLabel: 'Soft / High Muscular Fatigue (< 4.0)',
    significantShiftThreshold: 0.75,
    highSdThreshold: 0.65,
    appendixKey: 'Impact',
  },
  Energy: {
    key: 'Energy',
    label: 'Energy Return Index (0–10)',
    shortLabel: 'Energy',
    unit: '/10',
    yMin: 1.5,
    yMax: 7.5,
    idealMin: 3.8,
    idealMax: 5.5,
    idealLabel: 'Ideal Range: 3.8 – 5.5',
    highZoneLabel: 'Fast Rebound (> 5.5)',
    lowZoneLabel: 'Energy Dissipating / Heavy (< 3.8)',
    significantShiftThreshold: 0.5,
    highSdThreshold: 0.45,
    appendixKey: 'Energy',
  },
  Grip: {
    key: 'Grip',
    label: 'Grip & Traction Index (0–10)',
    shortLabel: 'Grip',
    unit: '/10',
    yMin: 3.0,
    yMax: 9.5,
    idealMin: 5.5,
    idealMax: 7.2,
    idealLabel: 'Ideal Range: 5.5 – 7.2',
    highZoneLabel: 'High Fixation / Torque Risk (> 7.2)',
    lowZoneLabel: 'Low Traction / Slip Risk (< 5.5)',
    significantShiftThreshold: 0.65,
    highSdThreshold: 0.65,
    appendixKey: 'Grip',
  },
  Hardness: {
    key: 'Hardness',
    label: 'Surface Hardness (Gm)',
    shortLabel: 'Hardness (Gm)',
    unit: 'Gm',
    yMin: 60,
    yMax: 112,
    idealMin: 68,
    idealMax: 85,
    idealLabel: 'Ideal Range: 68 – 85 Gm',
    highZoneLabel: 'Hard Surface / Peak Shock (> 85 Gm)',
    lowZoneLabel: 'Soft / Heavy Rootzone (< 68 Gm)',
    significantShiftThreshold: 7.0,
    highSdThreshold: 4.5,
    appendixKey: 'Hardness',
  },
  StudDepth: {
    key: 'StudDepth',
    label: 'Stud Penetration Depth (mm)',
    shortLabel: 'Stud Depth (mm)',
    unit: 'mm',
    yMin: 6.0,
    yMax: 15.0,
    idealMin: 9.5,
    idealMax: 13.5,
    idealLabel: 'Ideal Range: 9.5 – 13.5 mm',
    highZoneLabel: 'Deep Penetration / Soft Rootzone (> 13.5 mm)',
    lowZoneLabel: 'Shallow Penetration / Slip Risk (< 9.5 mm)',
    significantShiftThreshold: 1.2,
    highSdThreshold: 1.0,
    appendixKey: 'StudDepth',
  },
  RotationalTorque: {
    key: 'RotationalTorque',
    label: 'Rotational Resistance (Nm)',
    shortLabel: 'Rot. Torque (Nm)',
    unit: 'Nm',
    yMin: 30,
    yMax: 68,
    idealMin: 35,
    idealMax: 52,
    idealLabel: 'Ideal Range: 35 – 52 Nm',
    highZoneLabel: 'Excessive Torque / Stud Lock (> 52 Nm)',
    lowZoneLabel: 'Low Shear Resistance (< 35 Nm)',
    significantShiftThreshold: 4.0,
    highSdThreshold: 3.5,
    appendixKey: 'RotationalTorque',
  },
  Boot: {
    key: 'Boot',
    label: 'Boot Soleplate Index (0–10)',
    shortLabel: 'Boot Index',
    unit: '/10',
    yMin: 0.5,
    yMax: 7.5,
    idealMin: 2.5,
    idealMax: 5.3,
    idealLabel: 'Standard FG/Mixed Window: 2.5 – 5.3',
    highZoneLabel: 'Short Stud / Conical FG-S (> 5.3)',
    lowZoneLabel: 'Long Metal SG Required (< 2.5)',
    significantShiftThreshold: 0.75,
    highSdThreshold: 0.65,
    appendixKey: 'Boot',
  },
  Speed: {
    key: 'Speed',
    label: 'Speed Suitability (0–10)',
    shortLabel: 'Speed',
    unit: '/10',
    yMin: 2.5,
    yMax: 8.0,
    idealMin: 4.5,
    idealMax: 6.5,
    idealLabel: 'Target Window: 4.5 – 6.5',
    highZoneLabel: 'Fast / High Peak Stiffness (> 6.5)',
    lowZoneLabel: 'Slow / Dissipating (< 4.5)',
    significantShiftThreshold: 0.6,
    highSdThreshold: 0.5,
    appendixKey: 'Impact',
  },
  Recovery: {
    key: 'Recovery',
    label: 'Recovery Suitability (0–10)',
    shortLabel: 'Recovery',
    unit: '/10',
    yMin: 3.5,
    yMax: 7.5,
    idealMin: 5.2,
    idealMax: 6.5,
    idealLabel: 'Target Recovery Window: 5.2 – 6.5',
    highZoneLabel: 'High Cushion / Rebound (> 6.5)',
    lowZoneLabel: 'Harsh / Poor Recovery (< 5.2)',
    significantShiftThreshold: 0.5,
    highSdThreshold: 0.45,
    appendixKey: 'Impact',
  },
  Reaction: {
    key: 'Reaction',
    label: 'Reaction Suitability (0–10)',
    shortLabel: 'Reaction',
    unit: '/10',
    yMin: 3.5,
    yMax: 8.0,
    idealMin: 5.0,
    idealMax: 6.8,
    idealLabel: 'Target Window: 5.0 – 6.8',
    highZoneLabel: 'High Stiffness & Bite (> 6.8)',
    lowZoneLabel: 'Muted Reactivity (< 5.0)',
    significantShiftThreshold: 0.55,
    highSdThreshold: 0.45,
    appendixKey: 'Grip',
  },
  Metabolic: {
    key: 'Metabolic',
    label: 'Metabolic Load Suitability (0–10)',
    shortLabel: 'Metabolic',
    unit: '/10',
    yMin: 4.0,
    yMax: 8.5,
    idealMin: 5.5,
    idealMax: 7.2,
    idealLabel: 'Target Window: 5.5 – 7.2',
    highZoneLabel: 'High Internal Cost (> 7.2)',
    lowZoneLabel: 'Low Metabolic Demand (< 5.5)',
    significantShiftThreshold: 0.55,
    highSdThreshold: 0.45,
    appendixKey: 'Energy',
  },
  Power: {
    key: 'Power',
    label: 'Power Suitability (0–10)',
    shortLabel: 'Power',
    unit: '/10',
    yMin: 3.5,
    yMax: 8.5,
    idealMin: 5.0,
    idealMax: 7.0,
    idealLabel: 'Target Window: 5.0 – 7.0',
    highZoneLabel: 'High Force / Traction (> 7.0)',
    lowZoneLabel: 'Compliant / Low Force (< 5.0)',
    significantShiftThreshold: 0.6,
    highSdThreshold: 0.5,
    appendixKey: 'Impact',
  },
  Endurance: {
    key: 'Endurance',
    label: 'Endurance Suitability (0–10)',
    shortLabel: 'Endurance',
    unit: '/10',
    yMin: 4.0,
    yMax: 9.0,
    idealMin: 6.0,
    idealMax: 7.8,
    idealLabel: 'Target Window: 6.0 – 7.8',
    highZoneLabel: 'High Aerobic / Soft Turf (> 7.8)',
    lowZoneLabel: 'Firm / Fast Surface (< 6.0)',
    significantShiftThreshold: 0.6,
    highSdThreshold: 0.5,
    appendixKey: 'Energy',
  },
};

interface ChronologicalPoint {
  key: string;
  date: string;
  shortDate: string;
  sessionLabel: string;
  venueShort: string;
  objective: string;
  isMatchDay: boolean;
  mean: number;
  sd: number;
  min: number;
  max: number;
  deltaFromPrev: number | null;
  repEval: PitchEvaluation;
  allEvalsOnDate: PitchEvaluation[];
  impactMean: number;
  impactSd: number;
  energyMean: number;
  gripMean: number;
  hardnessMean: number;
  studDepthMean: number;
}

interface LongitudinalTimelineProps {
  evaluations: PitchEvaluation[];
  refBaseline?: PitchEvaluation;
  selectedPrimaryId: string;
  selectedCompareId: string;
  onSelectPrimary: (id: string) => void;
  onSelectCompare: (id: string) => void;
  onOpenAppendixA?: (metricKey: string) => void;
}

function calcMean(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function calcSd(vals: number[]): number {
  if (vals.length <= 1) return 0;
  const m = calcMean(vals);
  const variance = vals.reduce((acc, v) => acc + (v - m) ** 2, 0) / vals.length;
  return Math.sqrt(variance);
}

export const LongitudinalTimeline: React.FC<LongitudinalTimelineProps> = ({
  evaluations,
  refBaseline,
  selectedPrimaryId,
  selectedCompareId,
  onSelectPrimary,
  onSelectCompare,
  onOpenAppendixA,
}) => {
  const allSortedDates = useMemo(() => {
    const set = new Set(evaluations.map((e) => e.date));
    return Array.from(set).sort();
  }, [evaluations]);

  // Default to active camp window (Sep 21 -> Oct 6) so pre-camp Sep 2 baseline doesn't compress the daily camp spacing unless requested
  const defaultStart = allSortedDates.includes('2026-09-21')
    ? '2026-09-21'
    : allSortedDates[0] || '2026-09-02';
  const defaultEnd = allSortedDates[allSortedDates.length - 1] || '2026-10-06';

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [clinicalLens, setClinicalLens] = useState<ClinicalLensId>('patellar_achilles');
  const [trendMetric, setTrendMetric] = useState<ProgressionMetricKey>('Impact');
  const [aggregationMode, setAggregationMode] = useState<'daily_team' | 'primary_session'>(
    'daily_team'
  );
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null);

  const activeLensSpec =
    CLINICAL_LENSES.find((l) => l.id === clinicalLens) || CLINICAL_LENSES[0];
  const metricCfg = METRIC_CONFIGS[trendMetric];

  const handleSelectLens = (lensId: ClinicalLensId) => {
    setClinicalLens(lensId);
    const spec = CLINICAL_LENSES.find((l) => l.id === lensId);
    if (spec) {
      setTrendMetric(spec.defaultMetric);
    }
  };

  // Extract metric values for a given evaluation or group of evaluations
  const extractMetricStats = (evals: PitchEvaluation[], metric: ProgressionMetricKey) => {
    if (metric === 'Hardness') {
      // Synthesize zone-level hardness distribution from Impact zones + hardware mean
      const vals: number[] = [];
      evals.forEach((ev) => {
        const baseH = ev.hardwareMetrics.hardnessGm;
        const impMean = ev.averages.Impact;
        ev.zones.forEach((z) => {
          vals.push(baseH + (z.metrics.Impact - impMean) * 4.2);
        });
      });
      return {
        mean: Number(calcMean(vals).toFixed(1)),
        sd: Number(calcSd(vals).toFixed(1)),
        min: Number(Math.min(...vals).toFixed(1)),
        max: Number(Math.max(...vals).toFixed(1)),
      };
    }

    if (metric === 'StudDepth') {
      const vals: number[] = [];
      evals.forEach((ev) => {
        const baseS = ev.hardwareMetrics.studDepthMm;
        const gripMean = ev.averages.Grip;
        ev.zones.forEach((z) => {
          vals.push(Math.max(5.5, baseS + (z.metrics.Grip - gripMean) * 0.75));
        });
      });
      return {
        mean: Number(calcMean(vals).toFixed(2)),
        sd: Number(calcSd(vals).toFixed(2)),
        min: Number(Math.min(...vals).toFixed(1)),
        max: Number(Math.max(...vals).toFixed(1)),
      };
    }

    if (metric === 'RotationalTorque') {
      const vals: number[] = [];
      evals.forEach((ev) => {
        const baseT = ev.hardwareMetrics.rotationalResistanceNm;
        const gripMean = ev.averages.Grip;
        ev.zones.forEach((z) => {
          vals.push(baseT + (z.metrics.Grip - gripMean) * 3.8);
        });
      });
      return {
        mean: Number(calcMean(vals).toFixed(1)),
        sd: Number(calcSd(vals).toFixed(1)),
        min: Number(Math.min(...vals).toFixed(1)),
        max: Number(Math.max(...vals).toFixed(1)),
      };
    }

    // Standard 0-10 IndexName across all 18-zone measurements
    const zoneVals = evals.flatMap((ev) => ev.zones.map((z) => z.metrics[metric]));
    return {
      mean: Number(calcMean(zoneVals).toFixed(2)),
      sd: Number(calcSd(zoneVals).toFixed(2)),
      min: Number(Math.min(...zoneVals).toFixed(2)),
      max: Number(Math.max(...zoneVals).toFixed(2)),
    };
  };

  // Build chronological points independent of individual field lines
  const chronologicalPoints: ChronologicalPoint[] = useMemo(() => {
    const filteredDates = allSortedDates.filter((d) => d >= startDate && d <= endDate);

    const rawPoints = filteredDates.map((date) => {
      const dateEvals = evaluations.filter((e) => e.date === date);

      // Determine representative session surface for that date (e.g. Stadium if away, or recommended NTC pitch)
      const repEval =
        dateEvals.find((e) => !e.pitchName.startsWith('USSF Super')) ||
        dateEvals.find((e) => e.id === selectedPrimaryId) ||
        dateEvals.find((e) => e.pitchName === 'USSF Super 4' && (date === '2026-09-21' || date === '2026-09-22')) ||
        dateEvals.find((e) => e.pitchName === 'USSF Super 5') ||
        dateEvals[0];

      const activeEvals = aggregationMode === 'daily_team' ? dateEvals : [repEval];
      const stats = extractMetricStats(activeEvals, trendMetric);
      const impactStats = extractMetricStats(activeEvals, 'Impact');
      const energyStats = extractMetricStats(activeEvals, 'Energy');
      const gripStats = extractMetricStats(activeEvals, 'Grip');
      const hardnessStats = extractMetricStats(activeEvals, 'Hardness');
      const studStats = extractMetricStats(activeEvals, 'StudDepth');

      const isStadium = dateEvals.some((e) => !e.pitchName.startsWith('USSF Super'));
      const isMatchDay = isStadium && repEval.pitchName.includes('(MD)');

      let venueShort = 'NTC Training';
      if (repEval.pitchName.includes('Orlando')) {
        venueShort = isMatchDay ? 'Orlando (MD)' : 'Orlando (MD-1)';
      } else if (repEval.pitchName.includes('St. Louis')) {
        venueShort = 'St. Louis (MD)';
      } else if (repEval.pitchName.includes('Arizona')) {
        venueShort = 'Arizona (MD)';
      } else if (repEval.pitchName.includes('Minnesota')) {
        venueShort = 'Minnesota (MD)';
      } else if (date === '2026-09-02') {
        venueShort = 'NTC Baseline';
      } else {
        venueShort = `NTC (${repEval.sessionObjective})`;
      }

      const sessionLabel =
        dateEvals.length > 1
          ? aggregationMode === 'daily_team'
            ? `NTC Camp Session (${dateEvals.length} Pitches Pooled • ${dateEvals.length * 18} Zones)`
            : `${repEval.pitchName} (Primary Session Surface)`
          : repEval.pitchName;

      return {
        key: date,
        date,
        shortDate: date.slice(5),
        sessionLabel,
        venueShort,
        objective: repEval.sessionObjective,
        isMatchDay,
        mean: stats.mean,
        sd: stats.sd,
        min: stats.min,
        max: stats.max,
        deltaFromPrev: null as number | null,
        repEval,
        allEvalsOnDate: dateEvals,
        impactMean: impactStats.mean,
        impactSd: impactStats.sd,
        energyMean: energyStats.mean,
        gripMean: gripStats.mean,
        hardnessMean: hardnessStats.mean,
        studDepthMean: studStats.mean,
      };
    });

    // Compute day-over-day delta
    return rawPoints.map((pt, idx) => ({
      ...pt,
      deltaFromPrev:
        idx > 0 ? Number((pt.mean - rawPoints[idx - 1].mean).toFixed(2)) : null,
    }));
  }, [allSortedDates, startDate, endDate, evaluations, aggregationMode, trendMetric, selectedPrimaryId]);

  const refValue = useMemo(() => {
    if (!refBaseline) return null;
    if (trendMetric === 'Hardness') return refBaseline.hardwareMetrics.hardnessGm;
    if (trendMetric === 'StudDepth') return refBaseline.hardwareMetrics.studDepthMm;
    if (trendMetric === 'RotationalTorque')
      return refBaseline.hardwareMetrics.rotationalResistanceNm;
    return refBaseline.averages[trendMetric];
  }, [refBaseline, trendMetric]);

  // Summary diagnostics across the filtered date window
  const windowDiagnostics = useMemo(() => {
    if (chronologicalPoints.length === 0) return null;

    const overallMean = calcMean(chronologicalPoints.map((p) => p.mean));
    const avgSd = calcMean(chronologicalPoints.map((p) => p.sd));

    const outsideIdealPts = chronologicalPoints.filter(
      (p) => p.mean < metricCfg.idealMin || p.mean > metricCfg.idealMax
    );
    const aboveIdealPts = chronologicalPoints.filter((p) => p.mean > metricCfg.idealMax);
    const belowIdealPts = chronologicalPoints.filter((p) => p.mean < metricCfg.idealMin);

    // Steepest day-to-day shift
    let maxShiftPt = chronologicalPoints[0];
    let prevOfMaxShift = chronologicalPoints[0];
    let maxAbsDelta = 0;
    for (let i = 1; i < chronologicalPoints.length; i++) {
      const d = Math.abs(chronologicalPoints[i].deltaFromPrev || 0);
      if (d > maxAbsDelta) {
        maxAbsDelta = d;
        maxShiftPt = chronologicalPoints[i];
        prevOfMaxShift = chronologicalPoints[i - 1];
      }
    }

    // Highest within-session variance (SD)
    const maxSdPt = [...chronologicalPoints].sort((a, b) => b.sd - a.sd)[0];

    return {
      overallMean,
      avgSd,
      outsideIdealCount: outsideIdealPts.length,
      aboveIdealCount: aboveIdealPts.length,
      belowIdealCount: belowIdealPts.length,
      maxShiftPt,
      prevOfMaxShift,
      maxSdPt,
    };
  }, [chronologicalPoints, metricCfg]);

  const inspectedPoint = useMemo(() => {
    if (!chronologicalPoints.length) return null;
    if (selectedPointKey) {
      const found = chronologicalPoints.find((p) => p.key === selectedPointKey);
      if (found) return found;
    }
    // Default to the steepest shift point or latest match day so the inspector shows immediate clinical value
    return (
      windowDiagnostics?.maxShiftPt ||
      chronologicalPoints[chronologicalPoints.length - 1]
    );
  }, [chronologicalPoints, selectedPointKey, windowDiagnostics]);

  // SVG Chart Geometry
  const w = 940;
  const h = 340;
  const padL = 64;
  const padR = 38;
  const padT = 28;
  const padB = 64;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const getX = (idx: number) => {
    if (chronologicalPoints.length <= 1) return padL + plotW / 2;
    return padL + (idx / (chronologicalPoints.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(metricCfg.yMin, Math.min(metricCfg.yMax, val));
    return padT + (1 - (clamped - metricCfg.yMin) / (metricCfg.yMax - metricCfg.yMin)) * plotH;
  };

  const idealTopY = getY(metricCfg.idealMax);
  const idealBottomY = getY(metricCfg.idealMin);
  const idealBandH = Math.max(2, idealBottomY - idealTopY);

  // Build +/- 1 SD Variance Ribbon Polygon points
  const sdRibbonPoints = useMemo(() => {
    if (chronologicalPoints.length < 2) return '';
    const upper = chronologicalPoints.map(
      (p, i) => `${getX(i).toFixed(1)},${getY(p.mean + p.sd).toFixed(1)}`
    );
    const lower = [...chronologicalPoints]
      .reverse()
      .map((p, revIdx) => {
        const origIdx = chronologicalPoints.length - 1 - revIdx;
        return `${getX(origIdx).toFixed(1)},${getY(p.mean - p.sd).toFixed(1)}`;
      });
    return [...upper, ...lower].join(' ');
  }, [chronologicalPoints, metricCfg]);

  // Y-axis tick values
  const yTicks = useMemo(() => {
    const span = metricCfg.yMax - metricCfg.yMin;
    const step = span > 25 ? 10 : span > 10 ? 2 : 1;
    const first = Math.ceil(metricCfg.yMin / step) * step;
    const ticks: number[] = [];
    for (let v = first; v <= metricCfg.yMax; v += step) {
      ticks.push(Number(v.toFixed(1)));
    }
    return ticks;
  }, [metricCfg]);

  const formatVal = (v: number) =>
    metricCfg.unit === 'Gm' || metricCfg.unit === 'Nm' ? v.toFixed(1) : v.toFixed(2);

  // Evaluate clinical risk flag for any chronological point
  const getPointClinicalStatus = (pt: ChronologicalPoint) => {
    if (trendMetric === 'StudDepth') {
      if (pt.mean < metricCfg.idealMin) {
        return {
          status: 'overload' as const,
          color: '#DA291C',
          badgeBg: 'bg-red-50 text-[#DA291C] border-red-300',
          label: 'Shallow Stud Penetration (< 9.5 mm) — Slip / Adductor Risk',
        };
      }
      if (pt.mean > metricCfg.idealMax) {
        return {
          status: 'caution' as const,
          color: '#D97706',
          badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
          label: 'Deep Penetration (> 13.5 mm) — Soft / Heavy Turf',
        };
      }
    } else {
      if (pt.mean > metricCfg.idealMax) {
        return {
          status: 'overload' as const,
          color: '#DA291C',
          badgeBg: 'bg-red-50 text-[#DA291C] border-red-300',
          label:
            trendMetric === 'Impact' || trendMetric === 'Hardness'
              ? 'Above Ideal — High Patellar / Achilles Tendon Braking Load'
              : trendMetric === 'Grip' || trendMetric === 'RotationalTorque'
              ? 'Above Ideal — Elevated Rotational Fixation / Joint Torque'
              : 'Above Ideal Range',
        };
      }
      if (pt.mean < metricCfg.idealMin) {
        return {
          status: 'caution' as const,
          color: '#D97706',
          badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
          label:
            trendMetric === 'Impact' || trendMetric === 'Energy'
              ? 'Below Ideal — Soft / Energy-Dissipating (Calf & Hamstring Fatigue)'
              : 'Below Ideal Range',
        };
      }
    }

    if (pt.sd >= metricCfg.highSdThreshold) {
      return {
        status: 'variance' as const,
        color: '#D97706',
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
        label: `High Spatial Variance (±${formatVal(pt.sd)} SD) — Inconsistent Underfoot Stiffness`,
      };
    }

    return {
      status: 'optimal' as const,
      color: '#001489',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      label: 'Within Ideal Biomechanical Range',
    };
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================
          1. TOP FILTER BAR: DATE RANGE FILTER + CLINICAL LENS SELECTOR
          =================================================================== */}
      <div
        className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#001489] rounded-[10px] p-5 space-y-4"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#E5E9F0]">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#C69214]" />
              <h2 className="text-lg font-extrabold text-[#2E3440]">
                Camp Surface Progression &amp; Clinical Load Inspector
              </h2>
            </div>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Field-independent chronological exposure tracking (<strong className="text-[#2E3440]">Mean ± 1 SD</strong>{' '}
              variance over time) against the <strong className="text-emerald-700">Ideal Range</strong> and{' '}
              <strong className="text-purple-700">Reference Baseline</strong> to evaluate player soreness and chronic tendon/muscle loading.
            </p>
          </div>

          {/* Date Range Controls + Quick Window Presets */}
          <div className="flex flex-wrap items-center gap-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3.5 py-2">
            <Calendar className="w-4 h-4 text-[#C69214] shrink-0" />
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-extrabold uppercase tracking-[0.05em] text-[#64748B] text-[10px]">
                From
              </span>
              <select
                value={startDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setStartDate(v);
                  if (v > endDate) setEndDate(v);
                }}
                className="bg-white border border-[#CBD5E1] rounded-[6px] px-2 py-1 text-xs font-mono font-bold text-[#2E3440] cursor-pointer"
              >
                {allSortedDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <span className="font-extrabold uppercase tracking-[0.05em] text-[#64748B] text-[10px]">
                To
              </span>
              <select
                value={endDate}
                onChange={(e) => {
                  const v = e.target.value;
                  setEndDate(v);
                  if (v < startDate) setStartDate(v);
                }}
                className="bg-white border border-[#CBD5E1] rounded-[6px] px-2 py-1 text-xs font-mono font-bold text-[#2E3440] cursor-pointer"
              >
                {allSortedDates.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="h-4 w-[1px] bg-[#CBD5E1] hidden sm:block" />

            {/* Quick Date Window Presets */}
            <div className="flex items-center gap-1">
              {[
                { label: 'Active Camp (Sep 21–Oct 6)', start: '2026-09-21', end: '2026-10-06' },
                { label: 'Match Tour (Sep 25–Oct 6)', start: '2026-09-25', end: '2026-10-06' },
                { label: 'All Dates (Sep 2–Oct 6)', start: '2026-09-02', end: '2026-10-06' },
              ].map((preset) => {
                const isAct = startDate === preset.start && endDate === preset.end;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setStartDate(preset.start);
                      setEndDate(preset.end);
                    }}
                    className={`px-2 py-1 rounded-[5px] text-[11px] font-bold transition-all ${
                      isAct
                        ? 'bg-[#001489] text-white shadow-sm'
                        : 'bg-white text-[#434C5E] border border-[#CBD5E1] hover:border-[#C69214]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Clinical Complaint / Pathology Lens Selector */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#434C5E] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#DA291C]" />
              1. Select Clinical Complaint / Chronic Injury Lens:
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-[#64748B]">Multi-Field Day Mode:</span>
              <div className="inline-flex bg-[#F1F5F9] p-0.5 rounded-[6px] border border-[#E2E8F0]">
                <button
                  type="button"
                  onClick={() => setAggregationMode('daily_team')}
                  className={`px-2 py-0.5 rounded-[5px] text-[11px] font-extrabold ${
                    aggregationMode === 'daily_team'
                      ? 'bg-white text-[#001489] shadow-sm'
                      : 'text-[#64748B]'
                  }`}
                >
                  Pooled Daily Exposure (All Active Zones)
                </button>
                <button
                  type="button"
                  onClick={() => setAggregationMode('primary_session')}
                  className={`px-2 py-0.5 rounded-[5px] text-[11px] font-extrabold ${
                    aggregationMode === 'primary_session'
                      ? 'bg-white text-[#001489] shadow-sm'
                      : 'text-[#64748B]'
                  }`}
                >
                  Primary Session Pitch Only
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            {CLINICAL_LENSES.map((lens) => {
              const isSelected = clinicalLens === lens.id;
              return (
                <button
                  key={lens.id}
                  type="button"
                  onClick={() => handleSelectLens(lens.id)}
                  className={`text-left p-3 rounded-[8px] border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#EFF6FF] border-[1.5px] border-[#001489] border-l-[4px] border-l-[#C69214] shadow-sm'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#C69214]'
                  }`}
                >
                  <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-[#C69214]">
                      {lens.shortBadge}
                    </div>
                    <div className="text-xs font-black text-[#2E3440] mt-0.5 leading-snug">
                      {lens.title}
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] font-mono font-bold text-[#001489]">
                    <span>Primary: {METRIC_CONFIGS[lens.defaultMetric].shortLabel}</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================
          2. 4-CARD CAMP EXPOSURE & BIOMECHANICAL DIAGNOSTIC SUMMARY STRIP
          =================================================================== */}
      {windowDiagnostics && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Window Mean ± SD vs Ideal Range */}
          <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] block">
                Camp Window Exposure ({chronologicalPoints.length} Days)
              </span>
              <div className="flex items-baseline gap-2 mt-1 font-mono">
                <span className="text-2xl font-black text-[#001489]">
                  {formatVal(windowDiagnostics.overallMean)}
                </span>
                <span className="text-sm font-bold text-[#434C5E]">
                  ± {formatVal(windowDiagnostics.avgSd)} SD
                </span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#E5E9F0] flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-800">{metricCfg.idealLabel}</span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                  windowDiagnostics.outsideIdealCount > 0
                    ? 'bg-red-50 text-[#DA291C] border-red-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {windowDiagnostics.outsideIdealCount} of {chronologicalPoints.length} Days Outside Ideal
              </span>
            </div>
          </div>

          {/* Card 2: Steepest Day-to-Day Transition ("Transition Shock") */}
          <div className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#DA291C] rounded-[10px] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#DA291C] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Steepest Day-to-Day Shift (Transition Shock)
              </span>
              <div className="text-sm font-black text-[#2E3440] mt-1">
                {windowDiagnostics.prevOfMaxShift.shortDate} ({windowDiagnostics.prevOfMaxShift.venueShort}) →{' '}
                {windowDiagnostics.maxShiftPt.shortDate} ({windowDiagnostics.maxShiftPt.venueShort})
              </div>
              <div className="flex items-baseline gap-2 mt-1 font-mono">
                <span className="text-xl font-black text-[#DA291C]">
                  {(windowDiagnostics.maxShiftPt.deltaFromPrev || 0) > 0
                    ? `+${formatVal(windowDiagnostics.maxShiftPt.deltaFromPrev || 0)}`
                    : formatVal(windowDiagnostics.maxShiftPt.deltaFromPrev || 0)}{' '}
                  {metricCfg.shortLabel}
                </span>
                <span className="text-xs font-bold text-[#64748B]">
                  ({formatVal(windowDiagnostics.prevOfMaxShift.mean)} →{' '}
                  {formatVal(windowDiagnostics.maxShiftPt.mean)})
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E5E9F0] text-[11px] text-[#434C5E] font-medium">
              Abrupt surface shifts reduce tendon accommodation time and spike acute soreness.
            </div>
          </div>

          {/* Card 3: Peak Spatial Variance (Mean ± SD Spread) */}
          <div className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#C69214] rounded-[10px] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#92400E] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-[#C69214]" />
                Peak Within-Pitch Variance (Max ±SD)
              </span>
              <div className="text-sm font-black text-[#2E3440] mt-1">
                {windowDiagnostics.maxSdPt.date} • {windowDiagnostics.maxSdPt.venueShort}
              </div>
              <div className="flex items-baseline gap-2 mt-1 font-mono">
                <span className="text-xl font-black text-[#92400E]">
                  ±{formatVal(windowDiagnostics.maxSdPt.sd)} SD
                </span>
                <span className="text-xs font-bold text-[#64748B]">
                  (Zone Range: {formatVal(windowDiagnostics.maxSdPt.min)} –{' '}
                  {formatVal(windowDiagnostics.maxSdPt.max)})
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E5E9F0] text-[11px] text-[#434C5E] font-medium">
              High zone-to-zone SD forces constant neuromuscular stiffness recalibration across the pitch.
            </div>
          </div>

          {/* Card 4: Active Clinical Pathology Guidance */}
          <div className="bg-[#EFF6FF]/75 border border-[#BFDBFE] rounded-[10px] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#001489] block">
                Clinical Mechanism • {activeLensSpec.title}
              </span>
              <p className="text-[11px] text-[#2E3440] font-semibold mt-1 leading-relaxed">
                {activeLensSpec.mechanismSummary}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[#BFDBFE] text-[10px] font-bold text-[#001489]">
              Focus: {activeLensSpec.pathologyFocus}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          3. MAIN TIME-SERIES PROGRESSION CHART (MEAN ± 1 SD + Y-AXIS IDEAL RANGE)
          =================================================================== */}
      <div
        className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        {/* Chart Header & Metric Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E5E9F0]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#2E3440]">
                Chronological Team Exposure — {metricCfg.label} (Mean ± 1 SD &amp; Ideal Range)
              </h3>
              {onOpenAppendixA && (
                <MetricInfoTrigger
                  metricKey={metricCfg.appendixKey}
                  onOpenModal={onOpenAppendixA}
                />
              )}
            </div>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Each point displays the <strong className="text-[#2E3440]">Session Mean</strong>, vertical{' '}
              <strong className="text-[#001489]">±1 SD error bar</strong>, shaded variance envelope, and{' '}
              <strong className="text-emerald-700">Y-axis Ideal Range ({metricCfg.idealMin}–{metricCfg.idealMax})</strong>.
              Click any date point to inspect its clinical impact.
            </p>
          </div>

          {/* Metric Selector Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                'Impact',
                'Hardness',
                'Energy',
                'Grip',
                'StudDepth',
                'RotationalTorque',
                'Speed',
                'Recovery',
                'Reaction',
                'Metabolic',
              ] as ProgressionMetricKey[]
            ).map((mKey) => {
              const cfg = METRIC_CONFIGS[mKey];
              const isAct = trendMetric === mKey;
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setTrendMetric(mKey)}
                  className={`px-2.5 py-1 rounded-[6px] text-xs border transition-all ${
                    isAct
                      ? 'bg-[#001489] text-white border-[#C69214] font-extrabold shadow-sm'
                      : 'bg-[#F8F9FA] text-[#434C5E] border-[#CBD5E1] font-semibold hover:border-[#C69214]'
                  }`}
                >
                  {cfg.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="w-full overflow-x-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-3">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto min-w-[740px]">
            {/* 1. Upper Overload Zone (Above Ideal Max) */}
            {idealTopY > padT && (
              <g>
                <rect
                  x={padL}
                  y={padT}
                  width={plotW}
                  height={idealTopY - padT}
                  fill="rgba(218, 41, 28, 0.045)"
                />
                <text
                  x={w - padR - 8}
                  y={padT + 14}
                  textAnchor="end"
                  className="fill-[#DA291C] text-[10px] font-extrabold uppercase tracking-wider"
                >
                  ↑ {metricCfg.highZoneLabel}
                </text>
              </g>
            )}

            {/* 2. Shaded Green Ideal / Reference Range Band on Y-Axis */}
            <g>
              <rect
                x={padL}
                y={idealTopY}
                width={plotW}
                height={idealBandH}
                fill="rgba(16, 185, 129, 0.13)"
                stroke="#10B981"
                strokeWidth="1.2"
                strokeDasharray="5 3"
              />
              {/* Ideal Range Label Badge on Left Y-Axis */}
              <rect
                x={padL + 8}
                y={idealTopY + 6}
                width={158}
                height={18}
                rx={4}
                fill="#ECFDF5"
                stroke="#059669"
                strokeWidth="1"
              />
              <text
                x={padL + 14}
                y={idealTopY + 18}
                className="fill-emerald-900 text-[10px] font-extrabold"
              >
                ✓ {metricCfg.idealLabel}
              </text>
            </g>

            {/* 3. Lower Compliant / Underload Zone (Below Ideal Min) */}
            {idealBottomY < h - padB && (
              <g>
                <rect
                  x={padL}
                  y={idealBottomY}
                  width={plotW}
                  height={h - padB - idealBottomY}
                  fill="rgba(217, 119, 6, 0.045)"
                />
                <text
                  x={w - padR - 8}
                  y={h - padB - 8}
                  textAnchor="end"
                  className="fill-amber-800 text-[10px] font-extrabold uppercase tracking-wider"
                >
                  ↓ {metricCfg.lowZoneLabel}
                </text>
              </g>
            )}

            {/* 4. Horizontal Y-Axis Grid Lines & Tick Labels */}
            {yTicks.map((tv) => {
              const y = getY(tv);
              return (
                <g key={tv}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={w - padR}
                    y2={y}
                    stroke="#CBD5E1"
                    strokeDasharray="3 3"
                    strokeWidth="0.9"
                  />
                  <text
                    x={padL - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-[#434C5E] text-[10px] font-mono font-bold"
                  >
                    {tv}
                  </text>
                </g>
              );
            })}

            {/* Explicitly label Ideal Min and Ideal Max on the Left Y-Axis */}
            {[metricCfg.idealMin, metricCfg.idealMax].map((iv) => {
              const y = getY(iv);
              return (
                <g key={`ideal-${iv}`}>
                  <text
                    x={padL - 10}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-emerald-700 text-[10px] font-mono font-black"
                  >
                    {iv}
                  </text>
                </g>
              );
            })}

            {/* 5. Horizontal Dashed Purple REF Baseline Line */}
            {refValue !== null && (
              <g>
                <line
                  x1={padL}
                  y1={getY(refValue)}
                  x2={w - padR}
                  y2={getY(refValue)}
                  stroke="#7C3AED"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <rect
                  x={w - padR - 92}
                  y={getY(refValue) - 10}
                  width={86}
                  height={18}
                  rx={4}
                  fill="#F5F3FF"
                  stroke="#7C3AED"
                  strokeWidth="1.2"
                />
                <text
                  x={w - padR - 49}
                  y={getY(refValue) + 2}
                  textAnchor="middle"
                  className="fill-purple-800 text-[10px] font-mono font-extrabold"
                >
                  REF: {formatVal(refValue)}
                </text>
              </g>
            )}

            {/* 6. Vertical Date Guidelines & Bottom X-Axis Date + Session Context Labels */}
            {chronologicalPoints.map((pt, idx) => {
              const x = getX(idx);
              const isSelected = inspectedPoint?.key === pt.key;
              return (
                <g key={pt.key}>
                  <line
                    x1={x}
                    y1={padT}
                    x2={x}
                    y2={h - padB}
                    stroke={isSelected ? '#C69214' : '#E2E8F0'}
                    strokeWidth={isSelected ? '2' : '1'}
                  />
                  {/* Date Label */}
                  <text
                    x={x}
                    y={h - padB + 18}
                    textAnchor="middle"
                    className={`text-[11px] font-mono ${
                      isSelected ? 'fill-[#001489] font-black' : 'fill-[#2E3440] font-extrabold'
                    }`}
                  >
                    {pt.shortDate}
                  </text>
                  {/* Venue / Objective Sub-label */}
                  <text
                    x={x}
                    y={h - padB + 33}
                    textAnchor="middle"
                    className={`text-[9.5px] font-sans ${
                      pt.isMatchDay
                        ? 'fill-[#92400E] font-extrabold'
                        : 'fill-[#64748B] font-semibold'
                    }`}
                  >
                    {pt.venueShort}
                  </text>
                  {/* ±SD Sub-label at bottom of column */}
                  <text
                    x={x}
                    y={h - padB + 47}
                    textAnchor="middle"
                    className="fill-[#64748B] text-[9px] font-mono font-bold"
                  >
                    ±{formatVal(pt.sd)} SD
                  </text>
                </g>
              );
            })}

            {/* 7. Continuous Shaded Mean ± 1 SD Variance Ribbon across Time */}
            {sdRibbonPoints && (
              <polygon
                points={sdRibbonPoints}
                fill="rgba(0, 20, 137, 0.11)"
                stroke="rgba(0, 20, 137, 0.28)"
                strokeWidth="1"
              />
            )}

            {/* 8. Connecting Mean Progression Line & Steep Day-to-Day Transition Callouts */}
            {chronologicalPoints.length > 1 && (
              <>
                <polyline
                  fill="none"
                  stroke="#001489"
                  strokeWidth="3"
                  points={chronologicalPoints
                    .map((p, i) => `${getX(i).toFixed(1)},${getY(p.mean).toFixed(1)}`)
                    .join(' ')}
                />

                {/* Highlight Steep Transition Segments (e.g. Sep 28 -> Sep 29 St. Louis +1.91 Impact) */}
                {chronologicalPoints.map((pt, i) => {
                  if (i === 0 || pt.deltaFromPrev === null) return null;
                  const isSteep =
                    Math.abs(pt.deltaFromPrev) >= metricCfg.significantShiftThreshold;
                  if (!isSteep) return null;

                  const prevPt = chronologicalPoints[i - 1];
                  const x1 = getX(i - 1);
                  const y1 = getY(prevPt.mean);
                  const x2 = getX(i);
                  const y2 = getY(pt.mean);
                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;

                  return (
                    <g key={`shift-${pt.key}`}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#DA291C"
                        strokeWidth="3.5"
                      />
                      <rect
                        x={midX - 28}
                        y={midY - 11}
                        width={56}
                        height={18}
                        rx={4}
                        fill="#FEF2F2"
                        stroke="#DA291C"
                        strokeWidth="1.2"
                      />
                      <text
                        x={midX}
                        y={midY + 1}
                        textAnchor="middle"
                        className="fill-[#DA291C] text-[9.5px] font-mono font-black"
                      >
                        {pt.deltaFromPrev > 0
                          ? `+${formatVal(pt.deltaFromPrev)}↑`
                          : `${formatVal(pt.deltaFromPrev)}↓`}
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* 9. Vertical Mean ± 1 SD Error Bars (Whiskers + Caps) & Min-Max Ticks at Every Point */}
            {chronologicalPoints.map((pt, idx) => {
              const x = getX(idx);
              const meanY = getY(pt.mean);
              const sdTopY = getY(pt.mean + pt.sd);
              const sdBotY = getY(pt.mean - pt.sd);
              const minY = getY(pt.min);
              const maxY = getY(pt.max);
              const status = getPointClinicalStatus(pt);
              const isSelected = inspectedPoint?.key === pt.key;

              return (
                <g
                  key={`node-${pt.key}`}
                  className="cursor-pointer"
                  onClick={() => setSelectedPointKey(pt.key)}
                >
                  {/* Subtle Min-Max 18-Zone Range Whisker */}
                  <line
                    x1={x}
                    y1={maxY}
                    x2={x}
                    y2={minY}
                    stroke="#94A3B8"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                  <line x1={x - 3} y1={maxY} x2={x + 3} y2={maxY} stroke="#94A3B8" strokeWidth="1.2" />
                  <line x1={x - 3} y1={minY} x2={x + 3} y2={minY} stroke="#94A3B8" strokeWidth="1.2" />

                  {/* Bold Mean ± 1 SD Error Bar Whisker */}
                  <line
                    x1={x}
                    y1={sdTopY}
                    x2={x}
                    y2={sdBotY}
                    stroke={status.color}
                    strokeWidth="2.8"
                  />
                  {/* Top +1 SD Cap */}
                  <line
                    x1={x - 6}
                    y1={sdTopY}
                    x2={x + 6}
                    y2={sdTopY}
                    stroke={status.color}
                    strokeWidth="2.5"
                  />
                  {/* Bottom -1 SD Cap */}
                  <line
                    x1={x - 6}
                    y1={sdBotY}
                    x2={x + 6}
                    y2={sdBotY}
                    stroke={status.color}
                    strokeWidth="2.5"
                  />

                  {/* Selection Halo */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={meanY}
                      r="11"
                      fill="none"
                      stroke="#C69214"
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Central Mean Node Circle */}
                  <circle
                    cx={x}
                    cy={meanY}
                    r={isSelected ? '6.5' : '5.5'}
                    fill={status.color}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />

                  {/* Numeric Mean Callout Above Top SD Cap */}
                  <text
                    x={x}
                    y={Math.max(14, sdTopY - 7)}
                    textAnchor="middle"
                    className="fill-[#2E3440] text-[10px] font-mono font-black"
                  >
                    {formatVal(pt.mean)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Chart Legend Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-[#E5E9F0] text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-extrabold text-[#001489]">
              <span className="w-3 h-3 rounded-full bg-[#001489] inline-block" />
              Within Ideal Range (Mean ± 1 SD)
            </span>
            <span className="flex items-center gap-1.5 font-extrabold text-[#DA291C]">
              <span className="w-3 h-3 rounded-full bg-[#DA291C] inline-block" />
              Overload / High Tendon or Slip Risk
            </span>
            <span className="flex items-center gap-1.5 font-extrabold text-amber-800">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              Soft Surface or High Spatial Variance (±SD)
            </span>
            <span className="flex items-center gap-1.5 font-extrabold text-emerald-800">
              <span className="w-3.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-600 inline-block" />
              Y-Axis Ideal Range ({metricCfg.idealMin}–{metricCfg.idealMax})
            </span>
            <span className="flex items-center gap-1.5 font-extrabold text-purple-800">
              <span className="w-3.5 h-0.5 bg-purple-600 inline-block" />
              Purple REF Baseline
            </span>
          </div>
          <span className="text-[#64748B] font-semibold">
            Solid vertical bars = <strong>Mean ± 1 SD</strong> • Dashed extensions ={' '}
            <strong>18-Zone Min–Max</strong>
          </span>
        </div>
      </div>

      {/* ===================================================================
          4. SELECTED SESSION CLINICAL INSPECTOR + MANAGEMENT RECOMMENDATIONS
          =================================================================== */}
      {inspectedPoint && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 7 Columns: Selected Session Deep-Dive */}
          <div
            className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col justify-between"
            style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
          >
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#E5E9F0]">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#C69214] block">
                    Selected Camp Date Diagnostic • {inspectedPoint.date}
                  </span>
                  <h4 className="text-lg font-black text-[#2E3440]">
                    {inspectedPoint.sessionLabel}
                  </h4>
                </div>
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-full border ${
                    getPointClinicalStatus(inspectedPoint).badgeBg
                  }`}
                >
                  {getPointClinicalStatus(inspectedPoint).label}
                </span>
              </div>

              {/* 4 Key Exposure Metrics for this Date */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-mono">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
                  <span className="text-[10px] font-sans font-extrabold uppercase text-[#64748B] block">
                    {metricCfg.shortLabel} (Mean ± SD)
                  </span>
                  <strong className="text-base font-black text-[#001489]">
                    {formatVal(inspectedPoint.mean)} ± {formatVal(inspectedPoint.sd)}
                  </strong>
                  <span className="text-[10px] text-[#64748B] block mt-0.5">
                    Range: {formatVal(inspectedPoint.min)}–{formatVal(inspectedPoint.max)}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
                  <span className="text-[10px] font-sans font-extrabold uppercase text-[#64748B] block">
                    Day-to-Day Shift (Δ)
                  </span>
                  <strong
                    className={`text-base font-black ${
                      inspectedPoint.deltaFromPrev !== null &&
                      Math.abs(inspectedPoint.deltaFromPrev) >= metricCfg.significantShiftThreshold
                        ? 'text-[#DA291C]'
                        : 'text-[#2E3440]'
                    }`}
                  >
                    {inspectedPoint.deltaFromPrev === null
                      ? 'Window Start'
                      : inspectedPoint.deltaFromPrev > 0
                      ? `+${formatVal(inspectedPoint.deltaFromPrev)}`
                      : formatVal(inspectedPoint.deltaFromPrev)}
                  </strong>
                  <span className="text-[10px] text-[#64748B] font-sans block mt-0.5">
                    vs Previous Camp Session
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
                  <span className="text-[10px] font-sans font-extrabold uppercase text-[#64748B] block">
                    Surface Hardness
                  </span>
                  <strong className="text-base font-black text-[#92400E]">
                    {inspectedPoint.hardnessMean.toFixed(1)} Gm
                  </strong>
                  <span className="text-[10px] text-[#64748B] font-sans block mt-0.5">
                    Ideal: 68–85 Gm
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
                  <span className="text-[10px] font-sans font-extrabold uppercase text-[#64748B] block">
                    Stud Penetration
                  </span>
                  <strong className="text-base font-black text-[#2E3440]">
                    {inspectedPoint.studDepthMean.toFixed(1)} mm
                  </strong>
                  <span className="text-[10px] text-[#64748B] font-sans block mt-0.5">
                    Ideal: 9.5–13.5 mm
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#434C5E] font-medium leading-relaxed bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3.5">
                <strong className="text-[#2E3440]">Session Field Notes: </strong>
                {inspectedPoint.repEval.notes}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E5E9F0] flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-[#64748B] font-semibold">
                Load this session into the Pitch Comparator for 18-zone inspection:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectPrimary(inspectedPoint.repEval.id)}
                  className="px-3 py-1.5 rounded-[6px] bg-[#001489] hover:bg-[#1E3A8A] text-white text-xs font-extrabold border border-[#C69214]"
                >
                  Load as Pitch A ({inspectedPoint.repEval.pitchName})
                </button>
                <button
                  type="button"
                  onClick={() => onSelectCompare(inspectedPoint.repEval.id)}
                  className="px-3 py-1.5 rounded-[6px] bg-[#F8F9FA] hover:bg-[#FEF3C7] text-[#2E3440] text-xs font-extrabold border border-[#CBD5E1]"
                >
                  Load as Pitch B
                </button>
              </div>
            </div>
          </div>

          {/* Right 5 Columns: Practitioner & Medical Action Guide for Selected Lens */}
          <div
            className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col justify-between"
            style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
          >
            <div>
              <div className="pb-3 mb-3 border-b border-[#E5E9F0]">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#001489] flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#C69214]" />
                  Practitioner &amp; Medical Management Protocol
                </span>
                <h4 className="text-base font-black text-[#2E3440] mt-0.5">
                  {activeLensSpec.title}
                </h4>
              </div>

              <div className="space-y-3 text-xs text-[#434C5E]">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] border-l-[4px] border-l-[#001489] rounded-[8px] p-3">
                  <strong className="text-[#2E3440] block mb-1">
                    How Camp Conditions Evolved for This Pathology:
                  </strong>
                  <p className="leading-relaxed">
                    {clinicalLens === 'patellar_achilles' && (
                      <>
                        After 4 compliant training days at NTC (Impact <strong>3.7–4.6</strong>),
                        the squad experienced a sharp <strong>+1.91 Impact spike</strong> on Sept 29
                        (St. Louis: <strong>6.68 ± 0.35</strong>, 98.5 Gm) followed by high-stiffness,
                        high-variance surfaces in Arizona (<strong>6.24 ± 0.78</strong>) and
                        Minnesota (<strong>6.67 ± 0.76</strong>). This rapid upward stiffness shift
                        is the primary mechanical driver of patellar and Achilles tendon flare-ups.
                      </>
                    )}
                    {clinicalLens === 'muscular_fatigue' && (
                      <>
                        Soft, energy-absorbing exposures occurred on <strong>Sept 23 at NTC</strong>{' '}
                        (Impact dipped to <strong>3.06 ± 0.99</strong> on Field 3) and{' '}
                        <strong>Sept 25 Orlando MD-1</strong> (<strong>3.75 ± 0.87</strong> with 2.0
                        soft spots), elevating eccentric calf/hamstring demand immediately prior to
                        firmer match days.
                      </>
                    )}
                    {clinicalLens === 'joint_torque' && (
                      <>
                        While mean camp Grip remained inside the 5.5–7.2 ideal band after Sept 2,
                        localized central-pitch hotspots reached <strong>8.1 in Orlando</strong> and{' '}
                        <strong>8.4 in St. Louis (73.1 Nm peak torque)</strong>, creating localized
                        forefoot fixation hazards.
                      </>
                    )}
                    {clinicalLens === 'groin_adductor' && (
                      <>
                        Stud Penetration Depth dropped below the 9.5 mm ideal threshold in{' '}
                        <strong>St. Louis (9.1 mm)</strong> and <strong>Arizona (8.6 mm)</strong> due
                        to compact stadium rootzones, requiring shorter conical FG-S studs to prevent
                        lateral slipping and adductor overload.
                      </>
                    )}
                    {clinicalLens === 'general' && activeLensSpec.managementGuidance}
                  </p>
                </div>

                <div className="bg-[#FEF3C7]/45 border border-[#FDE68A] rounded-[8px] p-3">
                  <strong className="text-[#92400E] block mb-1">
                    Actionable Load &amp; Footwear Intervention:
                  </strong>
                  <p className="leading-relaxed text-[#2E3440] font-medium">
                    {activeLensSpec.managementGuidance}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          5. CHRONOLOGICAL CAMP PROGRESSION TABLE (MEAN ± SD & TRANSITIONS)
          =================================================================== */}
      <div
        className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5E9F0]">
          <div>
            <h3 className="text-base font-extrabold text-[#2E3440] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#C69214]" />
              Chronological Camp Surface Exposure Log ({chronologicalPoints.length} Dates in Range)
            </h3>
            <p className="text-xs text-[#64748B] font-medium">
              Ordered strictly by date from <strong>{startDate}</strong> to <strong>{endDate}</strong>,
              showing <strong>Mean ± 1 SD</strong>, <strong>18-Zone Min–Max</strong>, and{' '}
              <strong>Day-to-Day Shift (Δ)</strong>.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto border border-[#E2E8F0] rounded-[8px]">
          <table className="session-crud-table text-left">
            <thead>
              <tr>
                <th>Date</th>
                <th>Session / Venue Context</th>
                <th>Objective</th>
                <th className="text-right">{metricCfg.shortLabel} (Mean ± SD)</th>
                <th className="text-right">Zone Min–Max</th>
                <th className="text-right">Day-to-Day Δ</th>
                <th className="text-right">Impact (Mean ± SD)</th>
                <th className="text-right">Hardness</th>
                <th className="text-right">Stud Depth</th>
                <th className="text-center">Cleat Rec</th>
                <th className="text-left">Clinical Status</th>
                <th className="text-right">Compare</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {chronologicalPoints.map((pt) => {
                const isInspected = inspectedPoint?.key === pt.key;
                const isPrim = pt.repEval.id === selectedPrimaryId;
                const isComp = pt.repEval.id === selectedCompareId;
                const status = getPointClinicalStatus(pt);
                const bootRec = getBootRecommendation(
                  pt.repEval.averages.Boot,
                  pt.studDepthMean,
                  pt.gripMean
                );

                return (
                  <tr
                    key={pt.key}
                    onClick={() => setSelectedPointKey(pt.key)}
                    className={`cursor-pointer transition-colors ${
                      isInspected
                        ? 'bg-[#EFF6FF]'
                        : isComp
                        ? 'bg-[#FEF3C7]/35'
                        : 'hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <td className="whitespace-nowrap text-[#2E3440] font-extrabold">{pt.date}</td>
                    <td className="font-sans font-bold text-[#2E3440] whitespace-nowrap">
                      {pt.venueShort}
                      {pt.allEvalsOnDate.length > 1 && aggregationMode === 'daily_team' && (
                        <span className="ml-1.5 text-[10px] font-semibold text-[#64748B]">
                          (3 Pitches)
                        </span>
                      )}
                    </td>
                    <td className="font-sans">
                      <span className="px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#434C5E] text-[11px] font-bold">
                        {pt.objective}
                      </span>
                    </td>
                    <td className="text-right font-extrabold text-[#001489] whitespace-nowrap">
                      {formatVal(pt.mean)} <span className="text-[#64748B]">± {formatVal(pt.sd)}</span>
                    </td>
                    <td className="text-right text-[#434C5E] whitespace-nowrap">
                      {formatVal(pt.min)} – {formatVal(pt.max)}
                    </td>
                    <td
                      className={`text-right font-extrabold whitespace-nowrap ${
                        pt.deltaFromPrev !== null &&
                        Math.abs(pt.deltaFromPrev) >= metricCfg.significantShiftThreshold
                          ? 'text-[#DA291C]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {pt.deltaFromPrev === null
                        ? '—'
                        : pt.deltaFromPrev > 0
                        ? `+${formatVal(pt.deltaFromPrev)}`
                        : formatVal(pt.deltaFromPrev)}
                    </td>
                    <td className="text-right text-[#2E3440] whitespace-nowrap">
                      {pt.impactMean.toFixed(2)} ± {pt.impactSd.toFixed(2)}
                    </td>
                    <td className="text-right font-bold text-[#92400E] whitespace-nowrap">
                      {pt.hardnessMean.toFixed(1)} Gm
                    </td>
                    <td className="text-right text-[#434C5E] whitespace-nowrap">
                      {pt.studDepthMean.toFixed(1)} mm
                    </td>
                    <td className="text-center font-sans whitespace-nowrap">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${bootRec.badgeBg}`}
                      >
                        {bootRec.code}
                      </span>
                    </td>
                    <td className="font-sans whitespace-nowrap">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${status.badgeBg}`}
                      >
                        {status.status === 'optimal'
                          ? '✓ Ideal Range'
                          : status.status === 'overload'
                          ? '⚠ Overload / Risk'
                          : '⚠ Variance / Soft'}
                      </span>
                    </td>
                    <td
                      className="text-right whitespace-nowrap font-sans"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectPrimary(pt.repEval.id)}
                          className={`px-2 py-1 rounded-[5px] text-[10px] border transition-all ${
                            isPrim
                              ? 'bg-[#001489] text-white border-[#001489] font-extrabold'
                              : 'bg-white text-[#2E3440] border-[#CBD5E1] font-bold hover:border-[#001489]'
                          }`}
                        >
                          {isPrim ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Pitch A
                            </span>
                          ) : (
                            'Pitch A'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectCompare(pt.repEval.id)}
                          className={`px-2 py-1 rounded-[5px] text-[10px] border transition-all ${
                            isComp
                              ? 'bg-[#C69214] text-white border-[#C69214] font-extrabold'
                              : 'bg-white text-[#2E3440] border-[#CBD5E1] font-bold hover:border-[#C69214]'
                          }`}
                        >
                          Pitch B
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
