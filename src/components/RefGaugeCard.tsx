import React from 'react';
import { getKnowledgeSpec } from '../data/rawStadiaKnowledge';
import { IndexName, MetricReferenceStats, PitchZone } from '../types/rawStadia';
import {
  getMagnitudeAssessment,
  getZoneStatusColor,
  JOSE_REPORT_SCALE_BANDS,
} from '../utils/rawStadiaEngine';
import { MetricInfoTrigger } from './AppendixAModal';

export type TriadMiniMapMode = 'stackAB' | 'pitchA' | 'pitchB' | 'deltaAB';

interface RefGaugeCardProps {
  metric: IndexName;
  value: number;
  primarySd?: number;
  primaryLabel: string;
  compareValue: number;
  compareSd?: number;
  compareLabel: string;
  compareZones: PitchZone[];
  refStats: MetricReferenceStats;
  refLabel: string;
  zones: PitchZone[];
  selectedZone?: number | null;
  onSelectZone?: (zoneNum: number) => void;
  onOpenAppendixA?: (metricKey: IndexName) => void;
  miniMapMode?: TriadMiniMapMode;
  showMiniPitch?: boolean;
}

export const RefGaugeCard: React.FC<RefGaugeCardProps> = ({
  metric,
  value,
  primaryLabel,
  compareValue,
  compareLabel,
  compareZones,
  refStats,
  refLabel,
  zones,
  selectedZone,
  onSelectZone,
  onOpenAppendixA,
  miniMapMode = 'stackAB',
  showMiniPitch = true,
}) => {
  const spec = getKnowledgeSpec(metric);
  const joseBand = JOSE_REPORT_SCALE_BANDS[metric];
  const refValue = refStats.mean;
  const optimalRange: [number, number] = [refStats.bandMin, refStats.bandMax];

  const pctPrimary = Math.max(0, Math.min(100, (value / 10) * 100));
  const pctCompare = Math.max(0, Math.min(100, (compareValue / 10) * 100));
  const pctRef = Math.max(0, Math.min(100, (refValue / 10) * 100));
  const optStartPct = (optimalRange[0] / 10) * 100;
  const optWidthPct = Math.max(2, ((optimalRange[1] - optimalRange[0]) / 10) * 100);

  // Magnitude assessments using empirical Reference SD
  const magAB = getMagnitudeAssessment(metric, value, compareValue, refStats.sd);
  const magRef = getMagnitudeAssessment(metric, value, refValue, refStats.sd);

  // Compute 18-zone min, max, and SD for Pitch A and Pitch B
  const calcSpread = (zList: PitchZone[]) => {
    const vals = zList.map((z) => z.metrics[metric]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    const sd = Math.sqrt(
      vals.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (vals.length || 1)
    );
    return { min, max, sd };
  };

  const spreadA = calcSpread(zones);
  const spreadB = calcSpread(compareZones);

  const badgeA = getZoneStatusColor(metric, value, refStats);

  const renderSingleMiniPitch = (
    targetZones: PitchZone[],
    mode: 'pitchA' | 'pitchB' | 'deltaAB',
    headerTag: string,
    accentBorder: string
  ) => {
    const rows = [3, 2, 1].map((posX) =>
      [1, 2, 3, 4, 5, 6].map((posY) => targetZones.find((z) => z.posX === posX && z.posY === posY)!)
    );

    return (
      <div
        className={`relative rounded-[9px] p-2 overflow-hidden border-2 ${accentBorder}`}
        style={{
          background: 'linear-gradient(180deg, #166534 0%, #14532D 50%, #166534 100%)',
        }}
      >
        {/* Top Mini-Map Pitch Label */}
        <div className="relative z-10 flex items-center justify-between text-[9px] font-extrabold uppercase tracking-wider text-emerald-100/95 mb-1 px-1">
          <span className="truncate max-w-[190px]">{headerTag}</span>
          <span className="font-mono">
            {mode === 'pitchA'
              ? `${spreadA.min.toFixed(1)}–${spreadA.max.toFixed(1)} (±${spreadA.sd.toFixed(2)})`
              : mode === 'pitchB'
              ? `${spreadB.min.toFixed(1)}–${spreadB.max.toFixed(1)} (±${spreadB.sd.toFixed(2)})`
              : `Zone Δ (A − B)`}
          </span>
        </div>

        {/* Crisp White Soccer Pitch Markings SVG */}
        <svg
          viewBox="0 0 300 160"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
          preserveAspectRatio="none"
        >
          <rect x="4" y="4" width="292" height="152" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="150" y1="4" x2="150" y2="156" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="150" cy="80" r="26" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <rect x="4" y="34" width="42" height="92" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <rect x="4" y="54" width="16" height="52" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
          <rect x="254" y="34" width="42" height="92" fill="none" stroke="#FFFFFF" strokeWidth="2" />
          <rect x="280" y="54" width="16" height="52" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 flex flex-col gap-1.5">
          {rows.map((rowZones, rIdx) => (
            <div key={rIdx} className="grid grid-cols-6 gap-1 justify-items-center">
              {rowZones.map((z) => {
                if (!z) return null;
                const aVal =
                  zones.find((az) => az.zone === z.zone)?.metrics[metric] ?? z.metrics[metric];
                const bVal =
                  compareZones.find((bz) => bz.zone === z.zone)?.metrics[metric] ??
                  z.metrics[metric];
                const diffAB = Number((aVal - bVal).toFixed(1));

                const displayVal = mode === 'deltaAB' ? diffAB : z.metrics[metric];
                const zColor =
                  mode === 'deltaAB'
                    ? Math.abs(diffAB) < 0.3
                      ? { bg: 'bg-slate-600', border: 'border-slate-300', text: 'text-white' }
                      : diffAB > 0
                      ? { bg: 'bg-[#001489]', border: 'border-blue-200', text: 'text-white' }
                      : { bg: 'bg-[#C69214]', border: 'border-amber-200', text: 'text-white' }
                    : getZoneStatusColor(metric, z.metrics[metric], refStats);

                const isSelected = selectedZone === z.zone;

                return (
                  <button
                    key={z.zone}
                    type="button"
                    onClick={() => onSelectZone && onSelectZone(z.zone)}
                    title={`Zone ${z.zone} (Pos X=${z.posX}, Y=${z.posY}): Pitch A = ${aVal.toFixed(
                      2
                    )} | Pitch B = ${bVal.toFixed(2)} | Δ = ${
                      diffAB > 0 ? `+${diffAB}` : diffAB
                    }`}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-[10.5px] font-extrabold shadow-md border transition-transform ${
                      zColor.bg
                    } ${zColor.border} ${zColor.text} ${
                      isSelected
                        ? 'ring-2 ring-[#C69214] scale-110 z-20'
                        : 'hover:scale-105 opacity-95 hover:opacity-100'
                    }`}
                  >
                    {mode === 'deltaAB'
                      ? diffAB > 0
                        ? `+${diffAB.toFixed(1)}`
                        : diffAB.toFixed(1)
                      : displayVal.toFixed(1)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col justify-between transition-all hover:border-[#C69214]"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      <div>
        {/* Card Title Row */}
        <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-[#E5E9F0]">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black uppercase tracking-[0.08em] text-[#001489]">
              {metric}
            </span>
            <span className="text-[11px] font-bold text-[#64748B]">
              • {spec.lowSpectrum.title} ↔ {spec.highSpectrum.title}
            </span>
            {onOpenAppendixA && (
              <MetricInfoTrigger metricKey={metric} onOpenModal={onOpenAppendixA} />
            )}
          </div>
          <span
            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
              badgeA.status === 'optimal'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : badgeA.status === 'critical'
                ? 'bg-red-50 border-red-300 text-[#DA291C]'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            {badgeA.label}
          </span>
        </div>

        {/* LAYER 1: 3-Pitch Comparative Scoreboard Strip (Pitch A | Pitch B | Purple REF) */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
          {/* Column 1: Primary Pitch A (#001489 Navy) */}
          <div className="bg-[#EFF6FF]/75 border border-[#BFDBFE] border-t-[3px] border-t-[#001489] rounded-[8px] p-2 text-center">
            <div
              className="text-[9px] font-extrabold uppercase tracking-wider text-[#001489] truncate"
              title={`Pitch A: ${primaryLabel}`}
            >
              Pitch A (±{spreadA.sd.toFixed(2)})
            </div>
            <div className="text-2xl font-black text-[#2E3440] font-mono leading-tight my-0.5">
              {value.toFixed(2)}
            </div>
            <div className="text-[9px] font-bold text-[#434C5E] truncate" title={primaryLabel}>
              {primaryLabel}
            </div>
          </div>

          {/* Column 2: Compare Pitch B (#C69214 Gold) */}
          <div className="bg-[#FEF3C7]/45 border border-[#FDE68A] border-t-[3px] border-t-[#C69214] rounded-[8px] p-2 text-center">
            <div
              className="text-[9px] font-extrabold uppercase tracking-wider text-[#92400E] truncate"
              title={`Pitch B: ${compareLabel}`}
            >
              Pitch B (±{spreadB.sd.toFixed(2)})
            </div>
            <div className="text-2xl font-black text-[#2E3440] font-mono leading-tight my-0.5">
              {compareValue.toFixed(2)}
            </div>
            <div className="text-[9px] font-mono font-extrabold text-[#92400E]">
              A vs B: {magAB.delta > 0 ? `+${magAB.delta.toFixed(2)}` : magAB.delta.toFixed(2)} (
              {magAB.zScore > 0 ? `+${magAB.zScore.toFixed(1)}σ` : `${magAB.zScore.toFixed(1)}σ`})
            </div>
          </div>

          {/* Column 3: Reference Baseline (#7C3AED Purple) */}
          <div className="bg-purple-50/70 border border-purple-200 border-t-[3px] border-t-purple-600 rounded-[8px] p-2 text-center">
            <div
              className="text-[9px] font-extrabold uppercase tracking-wider text-purple-800 truncate"
              title={`REF: ${refLabel}`}
            >
              REF (±{refStats.sd.toFixed(2)})
            </div>
            <div className="text-2xl font-black text-purple-900 font-mono leading-tight my-0.5">
              {refValue.toFixed(2)}
            </div>
            <div className="text-[9px] font-mono font-extrabold text-purple-800">
              A vs REF:{' '}
              {magRef.delta > 0 ? `+${magRef.delta.toFixed(2)}` : magRef.delta.toFixed(2)} (
              {magRef.zScore > 0
                ? `+${magRef.zScore.toFixed(1)}σ`
                : `${magRef.zScore.toFixed(1)}σ`}
              )
            </div>
          </div>
        </div>

        {/* Magnitude Summary Pill (Pitch A vs Pitch B) */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
            A vs B Effect Size:
          </span>
          <span
            className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded border ${magAB.badgeClass}`}
          >
            {magAB.summaryText}
          </span>
        </div>

        {/* LAYER 2: 0–10 Multi-Marker Gauge Bar (Visualizing Jose's 5-Tier Report Scale + Pitch A + Pitch B + REF) */}
        <div className="mb-5">
          <div className="flex justify-between items-center text-[10px] font-bold text-[#64748B] mb-1 font-mono">
            <span>0.0 ({spec.lowSpectrum.title})</span>
            <span className="text-emerald-700 font-sans font-extrabold">
              Jose Report Green: {joseBand.desirableZoneMap[0].toFixed(1)}–{joseBand.desirableZoneMap[1].toFixed(1)} | Active Band: {optimalRange[0].toFixed(2)}–{optimalRange[1].toFixed(2)}
            </span>
            <span>10.0 ({spec.highSpectrum.title})</span>
          </div>

          <div className="relative h-6 rounded-[6px] bg-[#E2E8F0] overflow-visible flex items-center">
            {/* Exact 5-segment background bands from Jose's Field Status Report (media_7.png) */}
            <div
              style={{ width: `${joseBand.segmentWidthsPct[0]}%` }}
              className="h-full bg-[#E5E7EB] rounded-l-[6px] border-r border-white/70"
              title={`Outer Low (${joseBand.outerLow[0].toFixed(1)}–${joseBand.outerLow[1].toFixed(1)})`}
            />
            <div
              style={{ width: `${joseBand.segmentWidthsPct[1]}%` }}
              className="h-full bg-[#D1D5DB] border-r border-white/70"
              title={`Marginal Low (${joseBand.marginalLow[0].toFixed(1)}–${joseBand.marginalLow[1].toFixed(1)})`}
            />
            <div
              style={{ width: `${joseBand.segmentWidthsPct[2]}%` }}
              className="h-full bg-[#C1F7CF]/70 border-r border-white/70"
              title={`Jose Report Green Desirable Band (${joseBand.desirableGauge[0].toFixed(1)}–${joseBand.desirableGauge[1].toFixed(1)})`}
            />
            <div
              style={{ width: `${joseBand.segmentWidthsPct[3]}%` }}
              className="h-full bg-[#D1D5DB] border-r border-white/70"
              title={`Marginal High (${joseBand.marginalHigh[0].toFixed(1)}–${joseBand.marginalHigh[1].toFixed(1)})`}
            />
            <div
              style={{ width: `${joseBand.segmentWidthsPct[4]}%` }}
              className="h-full bg-[#E5E7EB] rounded-r-[6px]"
              title={`Outer High (${joseBand.outerHigh[0].toFixed(1)}–${joseBand.outerHigh[1].toFixed(1)})`}
            />

            {/* Highlighted Active Reference Range Band */}
            <div
              className="absolute top-0 bottom-0 bg-emerald-500/25 border-x-2 border-emerald-600/60 pointer-events-none"
              style={{ left: `${optStartPct}%`, width: `${optWidthPct}%` }}
            />

            {/* Pitch A 18-Zone Min–Max Whisker Line (Top Track) */}
            <div
              className="absolute top-[5px] h-[2px] bg-[#001489]/60 pointer-events-none"
              style={{
                left: `${(spreadA.min / 10) * 100}%`,
                width: `${Math.max(1, ((spreadA.max - spreadA.min) / 10) * 100)}%`,
              }}
            />

            {/* Pitch B 18-Zone Min–Max Whisker Line (Bottom Track) */}
            <div
              className="absolute bottom-[5px] h-[2px] bg-[#C69214]/75 pointer-events-none"
              style={{
                left: `${(spreadB.min / 10) * 100}%`,
                width: `${Math.max(1, ((spreadB.max - spreadB.min) / 10) * 100)}%`,
              }}
            />

            {/* Primary Pitch A Horizontal Bar Fill (Upper Half of Track) */}
            <div
              className="absolute left-0 top-1 h-2 rounded-r-full bg-[#001489] shadow-sm transition-all duration-300"
              style={{ width: `${pctPrimary}%` }}
            />

            {/* Compare Pitch B Horizontal Bar Fill (Lower Half of Track) */}
            <div
              className="absolute left-0 bottom-1 h-2 rounded-r-full bg-[#C69214] shadow-sm transition-all duration-300"
              style={{ width: `${pctCompare}%` }}
            />

            {/* Purple Vertical REF Line */}
            <div
              className="absolute -top-2 -bottom-2 w-[2.5px] bg-purple-600 z-10 shadow-sm"
              style={{ left: `${pctRef}%` }}
              title={`REF (${refLabel}): ${refValue.toFixed(2)}`}
            >
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-extrabold text-purple-700 tracking-wider whitespace-nowrap font-mono bg-purple-50 px-1 rounded border border-purple-200">
                REF {refValue.toFixed(1)}
              </div>
            </div>

            {/* Pitch B Gold Diamond/Circle Marker */}
            <div
              className="absolute bottom-[-3px] -translate-x-1/2 w-4 h-4 rounded-full bg-[#C69214] border-2 border-white shadow-md z-20 flex items-center justify-center text-[8px] font-black text-white"
              style={{ left: `${pctCompare}%` }}
              title={`Pitch B (${compareLabel}): ${compareValue.toFixed(2)} (Range ${spreadB.min.toFixed(
                1
              )}–${spreadB.max.toFixed(1)})`}
            >
              B
            </div>

            {/* Pitch A Navy Circle Marker */}
            <div
              className="absolute top-[-3px] -translate-x-1/2 w-4 h-4 rounded-full bg-[#001489] border-2 border-white shadow-md z-30 flex items-center justify-center text-[8px] font-black text-white"
              style={{ left: `${pctPrimary}%` }}
              title={`Pitch A (${primaryLabel}): ${value.toFixed(2)} (Range ${spreadA.min.toFixed(
                1
              )}–${spreadA.max.toFixed(1)})`}
            >
              A
            </div>
          </div>

          {/* 5-Band Tick Legend from Jose's Report */}
          <div className="mt-4 pt-1 flex items-center justify-between text-[9px] font-mono text-[#64748B]">
            <span>Outer: {joseBand.outerLow[0].toFixed(1)}–{joseBand.outerLow[1].toFixed(1)}</span>
            <span>Low: {joseBand.marginalLow[0].toFixed(1)}–{joseBand.marginalLow[1].toFixed(1)}</span>
            <span className="font-extrabold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
              Report Target: {joseBand.desirableGauge[0].toFixed(1)}–{joseBand.desirableGauge[1].toFixed(1)}
              {metric === 'Grip' ? ' (Map < 8.0)' : ''}
            </span>
            <span>High: {joseBand.marginalHigh[0].toFixed(1)}–{joseBand.marginalHigh[1].toFixed(1)}</span>
            <span>Outer: {joseBand.outerHigh[0].toFixed(1)}–{joseBand.outerHigh[1].toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* LAYER 3: 18-Zone Pitch Map Comparison */}
      {showMiniPitch && (
        <div className="mt-1 space-y-2">
          {miniMapMode === 'stackAB' && (
            <>
              {renderSingleMiniPitch(
                zones,
                'pitchA',
                `A: ${primaryLabel}`,
                'border-[#001489]'
              )}
              {renderSingleMiniPitch(
                compareZones,
                'pitchB',
                `B: ${compareLabel}`,
                'border-[#C69214]'
              )}
            </>
          )}
          {miniMapMode === 'pitchA' &&
            renderSingleMiniPitch(zones, 'pitchA', `Pitch A: ${primaryLabel}`, 'border-[#001489]')}
          {miniMapMode === 'pitchB' &&
            renderSingleMiniPitch(
              compareZones,
              'pitchB',
              `Pitch B: ${compareLabel}`,
              'border-[#C69214]'
            )}
          {miniMapMode === 'deltaAB' &&
            renderSingleMiniPitch(
              zones,
              'deltaAB',
              `Zone Δ (Pitch A − Pitch B)`,
              'border-purple-600'
            )}
        </div>
      )}

      {/* LAYER 4: PDF Spectrum Summary Footer */}
      <div className="mt-3 pt-2.5 border-t border-[#E5E9F0] grid grid-cols-2 gap-2 text-[10px]">
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-2">
          <div className="font-extrabold uppercase text-[#001489]">
            ← {spec.lowSpectrum.title}
          </div>
          <div className="text-[#434C5E] font-semibold mt-0.5">
            {spec.lowSpectrum.loadLabel} • {spec.lowSpectrum.usedFor}
          </div>
          <div className="text-[#64748B] mt-0.5">
            Watch: <strong className="text-[#92400E]">{spec.lowSpectrum.injuryRiskWatch}</strong>
          </div>
        </div>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-2 text-right">
          <div className="font-extrabold uppercase text-[#001489]">
            {spec.highSpectrum.title} →
          </div>
          <div className="text-[#434C5E] font-semibold mt-0.5">
            {spec.highSpectrum.loadLabel} • {spec.highSpectrum.usedFor}
          </div>
          <div className="text-[#64748B] mt-0.5">
            Watch: <strong className="text-[#DA291C]">{spec.highSpectrum.injuryRiskWatch}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
