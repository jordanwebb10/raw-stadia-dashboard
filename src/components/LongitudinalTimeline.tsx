import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Compass,
  Info,
  Layers,
  Microscope,
  Scale,
  TrendingUp,
} from 'lucide-react';
import { IndexName, PitchEvaluation, ReferenceBaselineProfile } from '../types/rawStadia';
import { RAW_STADIA_INDEX_SPECS } from '../data/rawStadiaKnowledge';
import { CORE_INDEX_NAMES } from '../utils/rawStadiaEngine';
import { MetricInfoTrigger } from './AppendixAModal';

export type ClinicalLensId = 'impact_lens' | 'energy_lens' | 'grip_lens' | 'triad_overview';

interface ClinicalLensSpec {
  id: ClinicalLensId;
  title: string;
  shortBadge: string;
  defaultMetric: IndexName;
  spectrumSummary: string;
  mechanismSummary: string;
  managementGuidance: string;
}

const CLINICAL_LENSES: ClinicalLensSpec[] = [
  {
    id: 'impact_lens',
    title: 'Impact: Soft vs. Hard Field Spectrum',
    shortBadge: 'PDF Spectrum • Muscles/Ligaments ↔ Tendons/Joints',
    defaultMetric: 'Impact',
    spectrumSummary:
      'SOFT FIELD (Energy Absorption • Watch: Muscles | Ligaments) ↔ HARD FIELD (Energy Return • Watch: Tendons | Joints)',
    mechanismSummary:
      'Higher Impact values (+1 SD above reference or rapid day-to-day jumps Δ ≥ +0.75) indicate a firmer surface with shorter deceleration time, whereas lower Impact values (−1 SD below reference) indicate a softer, energy-absorbing surface.',
    managementGuidance:
      'Suggested consideration: When transitioning abruptly to a Harder Field (+1 SD above baseline, e.g., St. Louis, Arizona, Minnesota), consider monitoring athletes with patellar/Achilles tendon or joint histories. On Softer Fields (−1 SD below baseline), consider monitoring muscular and ligamentous fatigue.',
  },
  {
    id: 'energy_lens',
    title: 'Energy: Dissipating vs. Rebounding Field',
    shortBadge: 'PDF Spectrum • Calves/Cramps ↔ Tendons/Joints',
    defaultMetric: 'Energy',
    spectrumSummary:
      'DISSIPATING FIELD (Energy Loss • Watch: Calves | Cramps) ↔ REBOUNDING FIELD (Energy Return • Watch: Tendons | Joints)',
    mechanismSummary:
      'Lower Energy Restitution values (−1 SD below reference) indicate a dissipating surface where the athlete works harder to generate propulsion, whereas higher Energy values (+1 SD above reference) indicate greater rebound.',
    managementGuidance:
      'Suggested consideration: Following sessions on a more Dissipating Field (lower Energy index), internal calf/soleus work and cramping susceptibility may be slightly elevated relative to external GPS distance.',
  },
  {
    id: 'grip_lens',
    title: 'Grip: Low vs. High Traction Field',
    shortBadge: 'PDF Spectrum • Groin/Slipping ↔ Ankle/Knee',
    defaultMetric: 'Grip',
    spectrumSummary:
      'LOW TRACTION FIELD (Less Resistance • Watch: Groin | Slipping) ↔ HIGH TRACTION FIELD (More Resistance • Watch: Ankle | Knee)',
    mechanismSummary:
      'Higher Grip values (+1 SD above reference or localized zone spikes ≥ 8.0) indicate stronger rotational fixation during pivoting, whereas lower Grip values (−1 SD below reference) indicate reduced shear resistance and higher slipping potential.',
    managementGuidance:
      'Suggested consideration: On High Traction Fields or pitches with wide ±SD grip variance, consider ankle/knee rotational load. On Low Traction Fields, consider adductor/groin stabilization demands.',
  },
  {
    id: 'triad_overview',
    title: 'All-3 Core Indexes Overview (Impact • Energy • Grip)',
    shortBadge: 'Full 3-Index Camp Progression',
    defaultMetric: 'Impact',
    spectrumSummary:
      'Simultaneous inspection of Impact (0–10), Energy (0–10), and Grip (0–10) across the selected camp date window.',
    mechanismSummary:
      'Tracks chronological team surface exposure (Session Mean ± 1 SD and 18-zone Min–Max spread) against the empirical Reference Band (Mean ± 1 SD) on the Y-axis.',
    managementGuidance:
      'Toggle between Impact, Energy, and Grip below to inspect day-to-day shifts (Δ), within-pitch spatial variance (±SD), and sessions falling outside the reference band.',
  },
];

interface LongitudinalTimelineProps {
  evaluations: PitchEvaluation[];
  selectedPrimaryId: string;
  selectedCompareId: string;
  referenceProfile: ReferenceBaselineProfile;
  onSelectPrimary: (id: string) => void;
  onSelectCompare: (id: string) => void;
  onOpenAppendixA?: (metricKey: string) => void;
}

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
  energySd: number;
  gripMean: number;
  gripSd: number;
}

function calcMean(vals: number[]): number {
  if (!vals.length) return 0;
  return Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2));
}

function calcSd(vals: number[], mean: number): number {
  if (!vals.length) return 0;
  const variance = vals.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / vals.length;
  return Number(Math.sqrt(variance).toFixed(2));
}

export const LongitudinalTimeline: React.FC<LongitudinalTimelineProps> = ({
  evaluations,
  selectedPrimaryId,
  referenceProfile,
  onSelectPrimary,
  onSelectCompare,
  onOpenAppendixA,
}) => {
  const allSortedDates = useMemo(() => {
    const set = new Set<string>(evaluations.map((e) => e.date));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [evaluations]);

  // Default to the active USMNT Camp window (Sept 21 -> Oct 6)
  const [startDate, setStartDate] = useState<string>('2026-09-21');
  const [endDate, setEndDate] = useState<string>(
    allSortedDates[allSortedDates.length - 1] || '2026-10-06'
  );
  const [clinicalLens, setClinicalLens] = useState<ClinicalLensId>('impact_lens');
  const [trendMetric, setTrendMetric] = useState<IndexName>('Impact');
  const [aggregationMode, setAggregationMode] = useState<'daily_team' | 'primary_session'>(
    'daily_team'
  );
  const [selectedPointKey, setSelectedPointKey] = useState<string | null>(null);
  const [showScienceExplainer, setShowScienceExplainer] = useState<boolean>(false);

  const activeLensSpec =
    CLINICAL_LENSES.find((l) => l.id === clinicalLens) || CLINICAL_LENSES[0];
  const activePdfSpec =
    RAW_STADIA_INDEX_SPECS.find((s) => s.index === trendMetric) || RAW_STADIA_INDEX_SPECS[0];
  const activeRefStats = referenceProfile.metrics[trendMetric];

  const significantShiftThreshold = trendMetric === 'Energy' ? 0.45 : 0.7;
  const highSdThreshold = trendMetric === 'Energy' ? 0.45 : 0.7;

  const handleSelectLens = (lensId: ClinicalLensId) => {
    setClinicalLens(lensId);
    const spec = CLINICAL_LENSES.find((l) => l.id === lensId);
    if (spec && lensId !== 'triad_overview') {
      setTrendMetric(spec.defaultMetric);
    }
  };

  // Build chronological points within [startDate, endDate]
  const chronologicalPoints = useMemo<ChronologicalPoint[]>(() => {
    const filteredDates = allSortedDates.filter((d) => d >= startDate && d <= endDate);

    const pickRepresentativeEval = (evalsOnDate: PitchEvaluation[]): PitchEvaluation => {
      if (evalsOnDate.length === 1) return evalsOnDate[0];
      const matchPitch = evalsOnDate.find((e) => !e.pitchName.startsWith('USSF Super'));
      if (matchPitch) return matchPitch;
      const super4 = evalsOnDate.find((e) => e.pitchName === 'USSF Super 4');
      if (super4) return super4;
      const super5 = evalsOnDate.find((e) => e.pitchName === 'USSF Super 5');
      if (super5) return super5;
      return evalsOnDate[0];
    };

    const getMetricValuesForEvals = (
      evalsToUse: PitchEvaluation[],
      mKey: IndexName
    ): { mean: number; sd: number; min: number; max: number } => {
      const zoneVals = evalsToUse.flatMap((ev) => ev.zones.map((z) => z.metrics[mKey]));
      const mean = calcMean(zoneVals);
      const sd = calcSd(zoneVals, mean);
      const min = Number(Math.min(...zoneVals).toFixed(2));
      const max = Number(Math.max(...zoneVals).toFixed(2));
      return { mean, sd, min, max };
    };

    const rawPoints = filteredDates.map((date) => {
      const dateEvals = evaluations.filter((e) => e.date === date);
      const repEval = pickRepresentativeEval(dateEvals);
      const evalsForStats = aggregationMode === 'daily_team' ? dateEvals : [repEval];

      const stats = getMetricValuesForEvals(evalsForStats, trendMetric);
      const impactStats = getMetricValuesForEvals(evalsForStats, 'Impact');
      const energyStats = getMetricValuesForEvals(evalsForStats, 'Energy');
      const gripStats = getMetricValuesForEvals(evalsForStats, 'Grip');

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
        energySd: energyStats.sd,
        gripMean: gripStats.mean,
        gripSd: gripStats.sd,
      };
    });

    return rawPoints.map((pt, idx) => ({
      ...pt,
      deltaFromPrev:
        idx > 0 ? Number((pt.mean - rawPoints[idx - 1].mean).toFixed(2)) : null,
    }));
  }, [allSortedDates, startDate, endDate, evaluations, aggregationMode, trendMetric, selectedPrimaryId]);

  // Summary diagnostics across the filtered date window
  const windowDiagnostics = useMemo(() => {
    if (chronologicalPoints.length === 0) return null;

    const overallMean = calcMean(chronologicalPoints.map((p) => p.mean));
    const avgSd = calcMean(chronologicalPoints.map((p) => p.sd));

    const outsideIdealPts = chronologicalPoints.filter(
      (p) => p.mean < activeRefStats.bandLow || p.mean > activeRefStats.bandHigh
    );

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

    const maxSdPt = [...chronologicalPoints].sort((a, b) => b.sd - a.sd)[0];

    return {
      overallMean,
      avgSd,
      outsideIdealCount: outsideIdealPts.length,
      maxShiftPt,
      prevOfMaxShift,
      maxSdPt,
    };
  }, [chronologicalPoints, activeRefStats]);

  const inspectedPoint = useMemo(() => {
    if (!chronologicalPoints.length) return null;
    if (selectedPointKey) {
      const found = chronologicalPoints.find((p) => p.key === selectedPointKey);
      if (found) return found;
    }
    return (
      windowDiagnostics?.maxShiftPt ||
      chronologicalPoints[chronologicalPoints.length - 1]
    );
  }, [chronologicalPoints, selectedPointKey, windowDiagnostics]);

  // SVG Chart Geometry (0–10 Raw Stadia Scale)
  const w = 940;
  const h = 340;
  const padL = 64;
  const padR = 38;
  const padT = 28;
  const padB = 64;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const yMin = 1.0;
  const yMax = 9.5;

  const getX = (idx: number) => {
    if (chronologicalPoints.length <= 1) return padL + plotW / 2;
    return padL + (idx / (chronologicalPoints.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    return padT + (1 - (clamped - yMin) / (yMax - yMin)) * plotH;
  };

  const idealTopY = getY(activeRefStats.bandHigh);
  const idealBottomY = getY(activeRefStats.bandLow);
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
  }, [chronologicalPoints]);

  const yTicks = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const formatVal = (v: number) => v.toFixed(2);

  // Evaluate contextual status for any chronological point against the active Reference Band
  const getPointClinicalStatus = (pt: ChronologicalPoint) => {
    if (pt.mean > activeRefStats.bandHigh) {
      return {
        status: 'overload' as const,
        color: '#DA291C',
        badgeBg: 'bg-red-50 text-[#DA291C] border-red-300',
        label: `Above Reference Band (${activePdfSpec.rightSpectrum.title} • Watch: ${activePdfSpec.rightSpectrum.suggestedInjuryWatch})`,
      };
    }
    if (pt.mean < activeRefStats.bandLow) {
      return {
        status: 'caution' as const,
        color: '#D97706',
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
        label: `Below Reference Band (${activePdfSpec.leftSpectrum.title} • Watch: ${activePdfSpec.leftSpectrum.suggestedInjuryWatch})`,
      };
    }
    if (pt.sd >= highSdThreshold) {
      return {
        status: 'variance' as const,
        color: '#D97706',
        badgeBg: 'bg-amber-50 text-amber-900 border-amber-300',
        label: `Suggested Watch: Higher Spatial Variance (±${formatVal(pt.sd)} SD Across Zones)`,
      };
    }
    return {
      status: 'optimal' as const,
      color: '#001489',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      label: `Within Reference Band ([${activeRefStats.bandLow.toFixed(2)}–${activeRefStats.bandHigh.toFixed(2)}])`,
    };
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================
          1. TOP FILTER BAR: DATE RANGE FILTER + PDF SPECTRUM LENS
          =================================================================== */}
      <div
        className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#001489] rounded-[10px] p-5 space-y-4"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#E5E9F0]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-[#C69214]" />
              <h2 className="text-lg font-extrabold text-[#2E3440]">
                Camp Surface Progression &amp; Spectrum Inspector (Impact • Energy • Grip)
              </h2>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] px-2.5 py-0.5 rounded-full bg-amber-50 text-[#92400E] border border-amber-300">
                Suggested Decision-Support • Non-Absolute
              </span>
            </div>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Field-independent chronological exposure tracking (<strong className="text-[#2E3440]">Mean ± 1 SD</strong>{' '}
              across 18 zones) against the active{' '}
              <strong className="text-emerald-700">
                Reference Band ({referenceProfile.label}: [{activeRefStats.bandLow.toFixed(2)}–
                {activeRefStats.bandHigh.toFixed(2)}])
              </strong>{' '}
              and <strong className="text-purple-700">REF Mean ({activeRefStats.mean.toFixed(2)})</strong>.
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

        {/* Suggested PDF Spectrum & Clinical Context Lens Selector */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#434C5E] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#C69214]" />
                1. Select Playing Surface Index Spectrum Lens (Exploratory Context):
              </span>
              <button
                type="button"
                onClick={() => setShowScienceExplainer((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[11px] font-extrabold bg-[#EFF6FF] text-[#001489] border border-[#BFDBFE] hover:border-[#001489] transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#C69214]" />
                {showScienceExplainer ? 'Hide Science & Reference Methodology' : 'View Science & Reference Methodology'}
                {showScienceExplainer ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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
                    <span>Active Index: {lens.defaultMetric}</span>
                    <span>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===================================================================
          1B. SCIENTIFIC EVIDENCE & EMPIRICAL REFERENCE RANGE EXPLAINER
          =================================================================== */}
      {showScienceExplainer && (
        <div
          className="bg-white border border-[#CBD5E1] border-l-[4px] border-l-[#C69214] rounded-[10px] p-5 space-y-4"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-[#E5E9F0]">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#001489]" />
                <h3 className="text-sm font-extrabold uppercase tracking-[0.05em] text-[#001489]">
                  Scientific Basis &amp; Reference Range Methodology: Impact • Energy • Grip
                </h3>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  Suggested Context • Not Deterministic
                </span>
              </div>
              <p className="text-xs text-[#434C5E] font-medium leading-relaxed max-w-4xl">
                <strong className="text-[#2E3440]">How this dashboard is constructed:</strong>{' '}
                All metrics come strictly from the 3 Raw Stadia Playing Surface Indexes (<strong>Impact</strong>,{' '}
                <strong>Energy</strong>, and <strong>Grip</strong>) measured across 18 zones per pitch. Instead of arbitrary cutoffs, the{' '}
                <strong className="text-purple-700">Purple REF Line</strong> and{' '}
                <strong className="text-emerald-700">Shaded Green Reference Band</strong> are computed directly from your empirical camp distribution (<strong className="font-mono">Mean ± 1 SD</strong>). All tissue watch tags from the Raw Stadia PDF are presented as{' '}
                <strong className="text-[#001489]">suggested considerations to guide clinical discussion, never as deterministic rules.</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowScienceExplainer(false)}
              className="text-xs font-bold text-[#64748B] hover:text-[#2E3440] px-2.5 py-1 rounded border border-[#E2E8F0] bg-[#F8FAFC]"
            >
              Collapse Explainer
            </button>
          </div>

          {/* 3-Tier Scientific Transparency Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Tier 1: Raw Stadia 3 Core Indexes */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Tier 1 • 18-Zone Empirical Data
                  </span>
                  <Microscope className="w-4 h-4 text-emerald-700" />
                </div>
                <h4 className="text-xs font-black text-[#2E3440]">
                  The 3 Raw Stadia Playing Surface Indexes (0–10)
                </h4>
                <p className="text-[11px] text-[#434C5E] leading-relaxed">
                  Each pitch evaluation samples <strong>18 standardized zones</strong> (3 width rows × 6 length columns) across three core mechanical indexes:
                </p>
                <ul className="text-[11px] text-[#434C5E] space-y-1.5 pl-4 list-disc">
                  <li>
                    <strong>Impact (0–10):</strong> Shock Absorption &amp; Vertical Deformation (<em>Soft Field ↔ Hard Field</em>).
                  </li>
                  <li>
                    <strong>Energy (0–10):</strong> Energy Restitution (<em>Dissipating Field ↔ Rebounding Field</em>).
                  </li>
                  <li>
                    <strong>Grip (0–10):</strong> Rotational Traction (<em>Low Traction Field ↔ High Traction Field</em>).
                  </li>
                </ul>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E2E8F0] text-[10px] font-bold text-emerald-800">
                Source: US Soccer × Raw Stadia 18-Zone Dataset &amp; Indexes PDF
              </div>
            </div>

            {/* Tier 2: Peer-Reviewed Biomechanics */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] px-2 py-0.5 rounded bg-blue-50 text-[#001489] border border-blue-200">
                    Tier 2 • Peer-Reviewed Biomechanics
                  </span>
                  <Scale className="w-4 h-4 text-[#001489]" />
                </div>
                <h4 className="text-xs font-black text-[#2E3440]">
                  Why the Spectrum Endpoints Matter Biomechanically
                </h4>
                <ul className="text-[11px] text-[#434C5E] space-y-1.5 pl-4 list-disc">
                  <li>
                    <strong>Soft vs. Hard Surface Stiffness:</strong> Athletes tune leg stiffness inversely to surface stiffness (<em>Ferris &amp; Farley, 1997; Kerdok et al., 2002</em>). Harder fields shorten braking attenuation time (Tendons | Joints), whereas softer fields increase surface deformation (Muscles | Ligaments).
                  </li>
                  <li>
                    <strong>Dissipating vs. Rebounding Turf:</strong> Energy-dissipating surfaces increase ground contact time and oxygen/muscular cost at matched running speeds (<em>Pinnington &amp; Dawson, 2001; Gaudino et al., 2013</em>).
                  </li>
                  <li>
                    <strong>Low vs. High Rotational Traction:</strong> High rotational resistance increases peak transverse-plane moments at the ankle and knee during cutting (<em>Villwock et al., 2009; Wannop et al., 2013</em>), while low traction elevates slip risk.
                  </li>
                </ul>
              </div>
              <div className="mt-3 pt-2 border-t border-[#E2E8F0] text-[10px] font-bold text-[#001489]">
                Confidence: Well-established directional biomechanical mechanisms
              </div>
            </div>

            {/* Tier 3: Empirical Reference Band (Mean +/- 1 SD) */}
            <div className="bg-[#FEF3C7]/35 border border-[#FDE68A] rounded-[8px] p-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] px-2 py-0.5 rounded bg-amber-100 text-[#92400E] border border-amber-300">
                    Tier 3 • Empirical Reference Band
                  </span>
                  <Compass className="w-4 h-4 text-[#92400E]" />
                </div>
                <h4 className="text-xs font-black text-[#2E3440]">
                  How Reference Ranges Are Estimated (Mean ± 1 SD)
                </h4>
                <p className="text-[11px] text-[#434C5E] leading-relaxed">
                  Rather than inventing arbitrary thresholds, the Y-axis reference band is calculated directly from the empirical zone distribution of your selected baseline:
                </p>
                <ul className="text-[11px] text-[#434C5E] space-y-1.5 pl-4 list-disc">
                  <li>
                    <strong>NTC Training Baseline (Default):</strong> Pooled across all NTC training sessions (<span className="font-mono">Impact: 4.33 ± 0.68 [3.65–5.01]</span>, <span className="font-mono">Energy: 3.98 ± 0.38 [3.60–4.36]</span>, <span className="font-mono">Grip: 6.24 ± 0.89 [5.35–7.13]</span>).
                  </li>
                  <li>
                    <strong>How to Read Z-Score Deviations:</strong> Sessions above <span className="font-mono">+1 SD</span> shift toward the right-hand PDF spectrum (Hard / Rebounding / High Traction); sessions below <span className="font-mono">−1 SD</span> shift toward the left-hand spectrum (Soft / Dissipating / Low Traction).
                  </li>
                </ul>
              </div>
              <div className="mt-3 pt-2 border-t border-[#FDE68A] text-[10px] font-bold text-[#92400E]">
                Application: Use as a contextual guidepost alongside clinical &amp; coaching judgment
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          2. 4-CARD CAMP EXPOSURE & SPECTRUM DIAGNOSTIC SUMMARY STRIP
          =================================================================== */}
      {windowDiagnostics && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Window Mean ± SD vs Active Reference Band */}
          <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] block">
                Camp Window Exposure ({chronologicalPoints.length} Days) • {trendMetric}
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
              <span className="font-bold text-emerald-800 font-mono">
                REF Band: [{activeRefStats.bandLow.toFixed(2)}–{activeRefStats.bandHigh.toFixed(2)}]
              </span>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${
                  windowDiagnostics.outsideIdealCount > 0
                    ? 'bg-amber-50 text-[#92400E] border-amber-300'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {windowDiagnostics.outsideIdealCount} of {chronologicalPoints.length} Days Outside ±1 SD
              </span>
            </div>
          </div>

          {/* Card 2: Steepest Day-to-Day Transition */}
          <div className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#DA291C] rounded-[10px] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#DA291C] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Largest Day-to-Day Surface Shift (Δ)
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
                  {trendMetric}
                </span>
                <span className="text-xs font-bold text-[#64748B]">
                  ({formatVal(windowDiagnostics.prevOfMaxShift.mean)} →{' '}
                  {formatVal(windowDiagnostics.maxShiftPt.mean)})
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E5E9F0] text-[11px] text-[#434C5E] font-medium">
              Steeper day-to-day surface transitions may warrant closer soreness monitoring.
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
                  (18-Zone Range: {formatVal(windowDiagnostics.maxSdPt.min)} –{' '}
                  {formatVal(windowDiagnostics.maxSdPt.max)})
                </span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-[#E5E9F0] text-[11px] text-[#434C5E] font-medium">
              Higher zone-to-zone SD indicates less uniform underfoot conditions across the 18 pitch zones.
            </div>
          </div>

          {/* Card 4: Active Raw Stadia PDF Spectrum Context */}
          <div className="bg-[#EFF6FF]/75 border border-[#BFDBFE] rounded-[10px] p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#001489] block">
                Raw Stadia PDF Spectrum • {activePdfSpec.index}
              </span>
              <p className="text-[11px] text-[#2E3440] font-semibold mt-1 leading-relaxed">
                {activeLensSpec.mechanismSummary}
              </p>
            </div>
            <div className="mt-2 pt-2 border-t border-[#BFDBFE] text-[10px] font-bold text-[#001489]">
              {activeLensSpec.spectrumSummary}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          3. MAIN TIME-SERIES PROGRESSION CHART (MEAN ± 1 SD + Y-AXIS REF BAND)
          =================================================================== */}
      <div
        className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        {/* Chart Header & 3 Core Index Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E5E9F0]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#2E3440]">
                Chronological Team Exposure — {activePdfSpec.index} Index (0–10) •{' '}
                {activePdfSpec.mechanicalProperty}
              </h3>
              {onOpenAppendixA && (
                <MetricInfoTrigger
                  metricKey={trendMetric}
                  onOpenModal={onOpenAppendixA}
                />
              )}
            </div>
            <p className="text-xs text-[#64748B] font-medium mt-0.5">
              Each point displays the <strong className="text-[#2E3440]">Session Mean</strong>, vertical{' '}
              <strong className="text-[#001489]">±1 SD error bar</strong>, shaded variance envelope, and{' '}
              <strong className="text-emerald-700">
                Reference Band ({referenceProfile.shortLabel}: {activeRefStats.bandLow.toFixed(2)}–
                {activeRefStats.bandHigh.toFixed(2)})
              </strong>.
              Click any date point to inspect its session details and suggested considerations.
            </p>
          </div>

          {/* 3 Core Playing Surface Index Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {CORE_INDEX_NAMES.map((mKey) => {
              const isAct = trendMetric === mKey;
              const spec = RAW_STADIA_INDEX_SPECS.find((s) => s.index === mKey)!;
              return (
                <button
                  key={mKey}
                  type="button"
                  onClick={() => setTrendMetric(mKey)}
                  className={`px-3 py-1.5 rounded-[7px] text-xs border transition-all flex items-center gap-1.5 ${
                    isAct
                      ? 'bg-[#001489] text-white border-[#C69214] font-extrabold shadow-sm'
                      : 'bg-[#F8F9FA] text-[#434C5E] border-[#CBD5E1] font-bold hover:border-[#C69214]'
                  }`}
                >
                  <span>{mKey}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded ${
                      isAct ? 'bg-white/15 text-amber-200' : 'text-[#64748B]'
                    }`}
                  >
                    ({spec.leftSpectrum.title.replace(' FIELD', '')} ↔{' '}
                    {spec.rightSpectrum.title.replace(' FIELD', '')})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SVG Chart Container */}
        <div className="w-full overflow-x-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-3">
          <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto min-w-[740px]">
            {/* 1. Upper Spectrum Zone (Above Reference Band High) */}
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
                  ↑ {activePdfSpec.rightSpectrum.title} ({activePdfSpec.rightSpectrum.subtitle} • Watch:{' '}
                  {activePdfSpec.rightSpectrum.suggestedInjuryWatch})
                </text>
              </g>
            )}

            {/* 2. Shaded Green Reference Band (Mean +/- 1 SD) on Y-Axis */}
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
              {/* Reference Range Label Badge on Left Y-Axis */}
              <rect
                x={padL + 8}
                y={idealTopY + 6}
                width={235}
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
                ✓ REF Band ({referenceProfile.shortLabel}): {activeRefStats.bandLow.toFixed(2)} –{' '}
                {activeRefStats.bandHigh.toFixed(2)}
              </text>
            </g>

            {/* 3. Lower Spectrum Zone (Below Reference Band Low) */}
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
                  ↓ {activePdfSpec.leftSpectrum.title} ({activePdfSpec.leftSpectrum.subtitle} • Watch:{' '}
                  {activePdfSpec.leftSpectrum.suggestedInjuryWatch})
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

            {/* Explicitly label Reference Band Low and High on the Left Y-Axis */}
            {[activeRefStats.bandLow, activeRefStats.bandHigh].map((iv) => {
              const y = getY(iv);
              return (
                <g key={`ideal-${iv}`}>
                  <text
                    x={padL - 10}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-emerald-700 text-[9.5px] font-mono font-black"
                  >
                    {iv.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* 5. Horizontal Dashed Purple REF Mean Line */}
            <g>
              <line
                x1={padL}
                y1={getY(activeRefStats.mean)}
                x2={w - padR}
                y2={getY(activeRefStats.mean)}
                stroke="#7C3AED"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              <rect
                x={w - padR - 104}
                y={getY(activeRefStats.mean) - 10}
                width={98}
                height={18}
                rx={4}
                fill="#F5F3FF"
                stroke="#7C3AED"
                strokeWidth="1.2"
              />
              <text
                x={w - padR - 55}
                y={getY(activeRefStats.mean) + 2}
                textAnchor="middle"
                className="fill-purple-800 text-[10px] font-mono font-extrabold"
              >
                REF Mean: {formatVal(activeRefStats.mean)}
              </text>
            </g>

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

                {/* Highlight Steep Transition Segments */}
                {chronologicalPoints.map((pt, i) => {
                  if (i === 0 || pt.deltaFromPrev === null) return null;
                  const isSteep = Math.abs(pt.deltaFromPrev) >= significantShiftThreshold;
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
              Within Reference Band (Mean ± 1 SD)
            </span>
            <span className="flex items-center gap-1.5 font-extrabold text-[#DA291C]">
              <span className="w-3 h-3 rounded-full bg-[#DA291C] inline-block" />
              Above +1 SD ({activePdfSpec.rightSpectrum.title} • {activePdfSpec.rightSpectrum.suggestedInjuryWatch})
            </span>
            <span className="flex items-center gap-1.5 font-extrabold text-amber-800">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              Below −1 SD ({activePdfSpec.leftSpectrum.title}) or High Zone Variance
            </span>
            <span className="flex items-center gap-1.5 font-extrabold text-emerald-800">
              <span className="w-3.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-600 inline-block" />
              REF Band ({activeRefStats.bandLow.toFixed(2)}–{activeRefStats.bandHigh.toFixed(2)})
            </span>
            <span className="flex items-center gap-1.5 font-extrabold text-purple-800">
              <span className="w-3.5 h-0.5 bg-purple-600 inline-block" />
              Purple REF Mean ({activeRefStats.mean.toFixed(2)})
            </span>
          </div>
          <span className="text-[#64748B] font-semibold">
            Solid vertical bars = <strong>Mean ± 1 SD</strong> • Dashed extensions ={' '}
            <strong>18-Zone Min–Max</strong>
          </span>
        </div>
      </div>

      {/* ===================================================================
          4. SELECTED SESSION CLINICAL INSPECTOR + SUGGESTED CONSIDERATIONS
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

              {/* 4 Key Exposure Metrics for this Date (Strictly Impact, Energy, Grip, & Day Shift) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-mono">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
                  <span className="text-[10px] font-sans font-extrabold uppercase text-[#64748B] block">
                    Impact (Mean ± SD)
                  </span>
                  <strong className="text-base font-black text-[#001489]">
                    {inspectedPoint.impactMean.toFixed(2)} ± {inspectedPoint.impactSd.toFixed(2)}
                  </strong>
                  <span className="text-[10px] text-emerald-800 font-sans font-semibold block mt-0.5">
                    REF: [{referenceProfile.metrics.Impact.bandLow.toFixed(2)}–
                    {referenceProfile.metrics.Impact.bandHigh.toFixed(2)}]
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
                  <span className="text-[10px] font-sans font-extrabold uppercase text-[#64748B] block">
                    Energy (Mean ± SD)
                  </span>
                  <strong className="text-base font-black text-[#2E3440]">
                    {inspectedPoint.energyMean.toFixed(2)} ± {inspectedPoint.energySd.toFixed(2)}
                  </strong>
                  <span className="text-[10px] text-emerald-800 font-sans font-semibold block mt-0.5">
                    REF: [{referenceProfile.metrics.Energy.bandLow.toFixed(2)}–
                    {referenceProfile.metrics.Energy.bandHigh.toFixed(2)}]
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
                  <span className="text-[10px] font-sans font-extrabold uppercase text-[#64748B] block">
                    Grip (Mean ± SD)
                  </span>
                  <strong className="text-base font-black text-[#2E3440]">
                    {inspectedPoint.gripMean.toFixed(2)} ± {inspectedPoint.gripSd.toFixed(2)}
                  </strong>
                  <span className="text-[10px] text-emerald-800 font-sans font-semibold block mt-0.5">
                    REF: [{referenceProfile.metrics.Grip.bandLow.toFixed(2)}–
                    {referenceProfile.metrics.Grip.bandHigh.toFixed(2)}]
                  </span>
                </div>

                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3">
                  <span className="text-[10px] font-sans font-extrabold uppercase text-[#64748B] block">
                    Day-to-Day Shift (Δ {trendMetric})
                  </span>
                  <strong
                    className={`text-base font-black ${
                      inspectedPoint.deltaFromPrev !== null &&
                      Math.abs(inspectedPoint.deltaFromPrev) >= significantShiftThreshold
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
                    vs Previous Session
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

          {/* Right 5 Columns: Suggested Practitioner & Medical Considerations */}
          <div
            className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col justify-between"
            style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
          >
            <div>
              <div className="pb-3 mb-3 border-b border-[#E5E9F0]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#001489] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#C69214]" />
                    Suggested Practitioner Considerations (Non-Absolute)
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#F1F5F9] text-[#434C5E] border border-[#CBD5E1]">
                    Advisory Only
                  </span>
                </div>
                <h4 className="text-base font-black text-[#2E3440] mt-0.5">
                  {activeLensSpec.title}
                </h4>
              </div>

              <div className="space-y-3 text-xs text-[#434C5E]">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] border-l-[4px] border-l-[#001489] rounded-[8px] p-3">
                  <strong className="text-[#2E3440] block mb-1">
                    Observed Camp Surface Progression for This Spectrum:
                  </strong>
                  <p className="leading-relaxed">
                    {clinicalLens === 'impact_lens' && (
                      <>
                        Following 4 training days at NTC within the <strong>3.65–5.01</strong> reference
                        band, the team encountered a <strong>+1.91 Impact jump</strong> on Sept 29 (St.
                        Louis: <strong>6.68 ± 0.35</strong>) followed by firmer, higher-variance
                        stadiums in Arizona (<strong>6.24 ± 0.78</strong>) and Minnesota (
                        <strong>6.67 ± 0.76</strong>). On the Raw Stadia Impact spectrum, this shifts
                        from a balanced surface toward a <strong>HARD FIELD</strong> (suggested watch:{' '}
                        <strong>Tendons | Joints</strong>).
                      </>
                    )}
                    {clinicalLens === 'energy_lens' && (
                      <>
                        Energy Restitution remained tightly clustered near the NTC mean (
                        <strong>3.98 ± 0.38</strong>) across most sessions, with lower-energy zones
                        appearing on <strong>Sept 23 at NTC (3.73 ± 0.38)</strong> and localized zones
                        in <strong>Orlando MD-1 (min 3.30)</strong>—shifting toward a{' '}
                        <strong>DISSIPATING FIELD</strong> (suggested watch:{' '}
                        <strong>Calves | Cramps</strong>).
                      </>
                    )}
                    {clinicalLens === 'grip_lens' && (
                      <>
                        While mean camp Grip stayed within the NTC reference band (
                        <strong>5.35–7.13</strong>) after Sept 2, localized central-corridor zones
                        reached <strong>8.10 in Orlando</strong> and <strong>8.40 in St. Louis</strong>
                        —shifting those specific zones into a <strong>HIGH TRACTION FIELD</strong>{' '}
                        (suggested watch: <strong>Ankle | Knee</strong>).
                      </>
                    )}
                    {clinicalLens === 'triad_overview' && activeLensSpec.managementGuidance}
                  </p>
                </div>

                <div className="bg-[#FEF3C7]/45 border border-[#FDE68A] rounded-[8px] p-3">
                  <strong className="text-[#92400E] block mb-1">
                    Suggested Clinical &amp; Load Considerations:
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
          5. CHRONOLOGICAL CAMP PROGRESSION TABLE (IMPACT, ENERGY, GRIP ONLY)
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
              Ordered chronologically from <strong>{startDate}</strong> to <strong>{endDate}</strong>,
              showing <strong>Mean ± 1 SD</strong> for <strong>Impact</strong>, <strong>Energy</strong>, and{' '}
              <strong>Grip</strong>, plus <strong>Day-to-Day Shift (Δ)</strong> and{' '}
              <strong>PDF Spectrum Watch Context</strong>.
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
                <th>
                  Active: {trendMetric} (Mean ± SD)
                </th>
                <th>18-Zone Range</th>
                <th>Day Shift (Δ)</th>
                <th>Impact (Mean ± SD)</th>
                <th>Energy (Mean ± SD)</th>
                <th>Grip (Mean ± SD)</th>
                <th>Suggested Spectrum Context</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {chronologicalPoints.map((pt) => {
                const status = getPointClinicalStatus(pt);
                const isSelected = inspectedPoint?.key === pt.key;
                const isSteepShift =
                  pt.deltaFromPrev !== null &&
                  Math.abs(pt.deltaFromPrev) >= significantShiftThreshold;

                return (
                  <tr
                    key={pt.key}
                    onClick={() => setSelectedPointKey(pt.key)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'selected-row' : ''
                    }`}
                  >
                    <td className="font-mono font-bold text-[#001489] whitespace-nowrap">
                      {pt.date}
                    </td>
                    <td className="font-extrabold text-[#2E3440]">
                      <div>{pt.venueShort}</div>
                      <div className="text-[11px] font-medium text-[#64748B]">
                        {pt.allEvalsOnDate.map((e) => e.pitchName).join(', ')}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          pt.isMatchDay
                            ? 'bg-amber-100 text-[#92400E] border border-amber-300'
                            : 'bg-[#EFF6FF] text-[#001489]'
                        }`}
                      >
                        {pt.objective}
                      </span>
                    </td>
                    <td className="font-mono font-black text-[#001489]">
                      {formatVal(pt.mean)}{' '}
                      <span className="text-xs font-semibold text-[#64748B]">
                        ± {formatVal(pt.sd)}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-[#434C5E] font-semibold">
                      {formatVal(pt.min)} – {formatVal(pt.max)}
                    </td>
                    <td className="font-mono font-bold">
                      {pt.deltaFromPrev === null ? (
                        <span className="text-xs text-[#94A3B8]">—</span>
                      ) : (
                        <span
                          className={`px-1.5 py-0.5 rounded text-xs ${
                            isSteepShift
                              ? 'bg-red-50 text-[#DA291C] border border-red-200 font-black'
                              : 'text-[#434C5E]'
                          }`}
                        >
                          {pt.deltaFromPrev > 0
                            ? `+${formatVal(pt.deltaFromPrev)}`
                            : formatVal(pt.deltaFromPrev)}
                        </span>
                      )}
                    </td>
                    <td className="font-mono font-bold text-[#2E3440]">
                      {pt.impactMean.toFixed(2)} ± {pt.impactSd.toFixed(2)}
                    </td>
                    <td className="font-mono font-bold text-[#2E3440]">
                      {pt.energyMean.toFixed(2)} ± {pt.energySd.toFixed(2)}
                    </td>
                    <td className="font-mono font-bold text-[#2E3440]">
                      {pt.gripMean.toFixed(2)} ± {pt.gripSd.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`text-[11px] font-extrabold px-2 py-0.5 rounded border inline-block ${status.badgeBg}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPrimary(pt.repEval.id);
                        }}
                        className="px-2.5 py-1 rounded bg-[#001489] hover:bg-[#1E3A8A] text-white text-xs font-bold"
                      >
                        Inspect Pitch A
                      </button>
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
