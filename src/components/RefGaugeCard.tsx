import React from 'react';
import { IndexName, PitchZone } from '../types/rawStadia';
import { getMagnitudeAssessment, getZoneStatusColor } from '../utils/rawStadiaEngine';
import { MetricInfoTrigger } from './AppendixAModal';

export type TriadMiniMapMode = 'stackAB' | 'pitchA' | 'pitchB' | 'deltaAB';

interface RefGaugeCardProps {
  metric: IndexName;
  value: number;
  primaryLabel: string;
  compareValue: number;
  compareLabel: string;
  compareZones: PitchZone[];
  refValue: number;
  refLabel: string;
  optimalRange: [number, number];
  zones: PitchZone[];
  selectedZone?: number | null;
  onSelectZone?: (zoneNum: number) => void;
  onOpenAppendixA?: (metricKey: string) => void;
  miniMapMode?: TriadMiniMapMode;
  showMiniPitch?: boolean;
  subtitle?: string;
}

export const RefGaugeCard: React.FC<RefGaugeCardProps> = ({
  metric,
  value,
  primaryLabel,
  compareValue,
  compareLabel,
  compareZones,
  refValue,
  refLabel,
  optimalRange,
  zones,
  selectedZone,
  onSelectZone,
  onOpenAppendixA,
  miniMapMode = 'stackAB',
  showMiniPitch = true,
  subtitle,
}) => {
  const pctPrimary = Math.max(0, Math.min(100, (value / 10) * 100));
  const pctCompare = Math.max(0, Math.min(100, (compareValue / 10) * 100));
  const pctRef = Math.max(0, Math.min(100, (refValue / 10) * 100));
  const optStartPct = (optimalRange[0] / 10) * 100;
  const optWidthPct = ((optimalRange[1] - optimalRange[0]) / 10) * 100;

  // Magnitude assessments for Pitch A vs Pitch B and Pitch A vs REF
  const magAB = getMagnitudeAssessment(metric, value, compareValue, 'idx');
  const magRef = getMagnitudeAssessment(metric, value, refValue, 'idx');

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

  const badgeA = getZoneStatusColor(metric, value);

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
                const aVal = zones.find((az) => az.zone === z.zone)?.metrics[metric] ?? z.metrics[metric];
                const bVal =
                  compareZones.find((bz) => bz.zone === z.zone)?.metrics[metric] ?? z.metrics[metric];
                const diffAB = Number((aVal - bVal).toFixed(1));

                const displayVal = mode === 'deltaAB' ? diffAB : z.metrics[metric];
                const zColor =
                  mode === 'deltaAB'
                    ? Math.abs(diffAB) < 0.3
                      ? { bg: 'bg-slate-600', border: 'border-slate-300', text: 'text-white' }
                      : diffAB > 0
                      ? { bg: 'bg-[#001489]', border: 'border-blue-200', text: 'text-white' }
                      : { bg: 'bg-[#C69214]', border: 'border-amber-200', text: 'text-white' }
                    : getZoneStatusColor(metric, z.metrics[metric]);

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
              • {subtitle || '0–10 Index'}
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
              Pitch A
            </div>
            <div className="text-2xl font-black text-[#2E3440] font-mono leading-tight my-0.5">
              {value.toFixed(1)}
            </div>
            <div
              className="text-[9px] font-bold text-[#434C5E] truncate"
              title={primaryLabel}
            >
              {primaryLabel}
            </div>
          </div>

          {/* Column 2: Compare Pitch B (#C69214 Gold) */}
          <div className="bg-[#FEF3C7]/45 border border-[#FDE68A] border-t-[3px] border-t-[#C69214] rounded-[8px] p-2 text-center">
            <div
              className="text-[9px] font-extrabold uppercase tracking-wider text-[#92400E] truncate"
              title={`Pitch B: ${compareLabel}`}
            >
              Pitch B
            </div>
            <div className="text-2xl font-black text-[#2E3440] font-mono leading-tight my-0.5">
              {compareValue.toFixed(1)}
            </div>
            <div className="text-[9px] font-mono font-extrabold text-[#92400E]">
              A vs B: {magAB.delta > 0 ? `+${magAB.delta.toFixed(1)}` : magAB.delta.toFixed(1)} (
              {magAB.zScore > 0 ? `+${magAB.zScore.toFixed(1)}σ` : `${magAB.zScore.toFixed(1)}σ`})
            </div>
          </div>

          {/* Column 3: Reference Baseline (Purple REF) */}
          <div className="bg-purple-50/70 border border-purple-200 border-t-[3px] border-t-purple-600 rounded-[8px] p-2 text-center">
            <div
              className="text-[9px] font-extrabold uppercase tracking-wider text-purple-800 truncate"
              title={`REF: ${refLabel}`}
            >
              Purple REF
            </div>
            <div className="text-2xl font-black text-purple-900 font-mono leading-tight my-0.5">
              {refValue.toFixed(1)}
            </div>
            <div className="text-[9px] font-mono font-extrabold text-purple-800">
              A vs REF: {magRef.delta > 0 ? `+${magRef.delta.toFixed(1)}` : magRef.delta.toFixed(1)} (
              {magRef.zScore > 0 ? `+${magRef.zScore.toFixed(1)}σ` : `${magRef.zScore.toFixed(1)}σ`})
            </div>
          </div>
        </div>

        {/* LAYER 2: Dual 0-10 Horizontal Gauge Track (Pitch A + Pitch B) with Shared Optimal Band & Purple REF Line */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3 mb-3.5">
          <div className="flex justify-between text-[10px] font-bold text-[#64748B] mb-1.5">
            <span>0.0</span>
            <span className="text-emerald-700 font-extrabold">
              Optimal Window: {optimalRange[0].toFixed(1)}–{optimalRange[1].toFixed(1)}
            </span>
            <span>10.0</span>
          </div>

          <div className="relative space-y-2 py-1">
            {/* Shared Vertical Purple REF Marker Line slicing through BOTH Pitch A and Pitch B bars */}
            <div
              className="absolute -top-1 -bottom-3.5 w-0.5 bg-purple-600 z-20 pointer-events-none shadow-[0_0_6px_rgba(124,58,237,0.6)]"
              style={{ left: `${pctRef}%` }}
              title={`REF (${refLabel}): ${refValue.toFixed(2)}`}
            >
              <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] font-extrabold text-purple-800 bg-purple-50 border border-purple-300 px-1 rounded whitespace-nowrap">
                REF {refValue.toFixed(1)}
              </span>
            </div>

            {/* Bar 1: Pitch A (USSF Navy #001489) */}
            <div>
              <div className="flex justify-between text-[10px] font-bold mb-0.5">
                <span className="text-[#001489] truncate max-w-[180px]">
                  A: {primaryLabel}
                </span>
                <span className="font-mono font-black text-[#001489]">{value.toFixed(2)}</span>
              </div>
              <div className="relative h-3 bg-white border border-[#CBD5E1] rounded-full overflow-hidden">
                {/* Shaded Green Optimal Band */}
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-500/60"
                  style={{ left: `${optStartPct}%`, width: `${optWidthPct}%` }}
                />
                <div
                  className="relative h-full bg-[#001489] rounded-full transition-all duration-300 z-10"
                  style={{ width: `${pctPrimary}%` }}
                />
              </div>
            </div>

            {/* Bar 2: Pitch B (USSF Gold #C69214) */}
            <div>
              <div className="flex justify-between text-[10px] font-bold mb-0.5">
                <span className="text-[#92400E] truncate max-w-[180px]">
                  B: {compareLabel}
                </span>
                <span className="font-mono font-black text-[#92400E]">{compareValue.toFixed(2)}</span>
              </div>
              <div className="relative h-3 bg-white border border-[#CBD5E1] rounded-full overflow-hidden">
                {/* Shaded Green Optimal Band */}
                <div
                  className="absolute top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-500/60"
                  style={{ left: `${optStartPct}%`, width: `${optWidthPct}%` }}
                />
                <div
                  className="relative h-full bg-[#C69214] rounded-full transition-all duration-300 z-10"
                  style={{ width: `${pctCompare}%` }}
                />
              </div>
            </div>
          </div>

          {/* Magnitude Summary Footer inside Gauge Box */}
          <div className="mt-4 pt-2 border-t border-[#E2E8F0] flex flex-col gap-1">
            <div className="flex items-center justify-between gap-1 text-[10px]">
              <span className="font-extrabold text-[#434C5E]">Pitch A vs Pitch B:</span>
              <span className={`font-extrabold px-1.5 py-0.5 rounded border ${magAB.badgeClass}`}>
                {magAB.summaryText}
              </span>
            </div>
            <p className="text-[10.5px] text-[#64748B] font-medium leading-snug">
              {magAB.clinicalNote}
            </p>
          </div>
        </div>
      </div>

      {/* LAYER 3: 18-Zone Mini Pitch Map(s) (Supports Stacked A+B, Pitch A, Pitch B, or Zone Delta A-B) */}
      {showMiniPitch && (
        <div className="space-y-2">
          {miniMapMode === 'stackAB' ? (
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
          ) : miniMapMode === 'pitchB' ? (
            renderSingleMiniPitch(
              compareZones,
              'pitchB',
              `B: ${compareLabel}`,
              'border-[#C69214]'
            )
          ) : miniMapMode === 'deltaAB' ? (
            renderSingleMiniPitch(
              zones,
              'deltaAB',
              `Δ A − B (${primaryLabel} vs ${compareLabel})`,
              'border-[#15803D]'
            )
          ) : (
            renderSingleMiniPitch(
              zones,
              'pitchA',
              `A: ${primaryLabel}`,
              'border-[#001489]'
            )
          )}
        </div>
      )}
    </div>
  );
};
