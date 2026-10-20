import React from 'react';
import { IndexName, PitchZone } from '../types/rawStadia';
import { getZoneStatusColor } from '../utils/rawStadiaEngine';

interface RefGaugeCardProps {
  metric: IndexName;
  value: number;
  refValue: number;
  refLabel: string;
  optimalRange: [number, number];
  zones: PitchZone[];
  selectedZone?: number | null;
  onSelectZone?: (zoneNum: number) => void;
  showMiniPitch?: boolean;
  subtitle?: string;
}

export const RefGaugeCard: React.FC<RefGaugeCardProps> = ({
  metric,
  value,
  refValue,
  refLabel,
  optimalRange,
  zones,
  selectedZone,
  onSelectZone,
  showMiniPitch = true,
  subtitle,
}) => {
  const pctValue = Math.max(0, Math.min(100, (value / 10) * 100));
  const pctRef = Math.max(0, Math.min(100, (refValue / 10) * 100));
  const optStartPct = (optimalRange[0] / 10) * 100;
  const optWidthPct = ((optimalRange[1] - optimalRange[0]) / 10) * 100;
  const delta = Number((value - refValue).toFixed(2));

  // Organize 18 zones into 3 rows (posX = 3 top, 2 middle, 1 bottom) x 6 cols (posY = 1..6)
  const rows = [3, 2, 1].map((posX) =>
    [1, 2, 3, 4, 5, 6].map((posY) => zones.find((z) => z.posX === posX && z.posY === posY)!)
  );

  const badge = getZoneStatusColor(metric, value);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-colors">
      {/* Top Numeric Header (Matches Jordan's Sept 26 Mockup media_7.png) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {subtitle || 'Raw Stadia Index'}
          </span>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
              badge.status === 'optimal'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                : badge.status === 'critical'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}
          >
            {badge.label}
          </span>
        </div>

        <div className="text-center my-2">
          <div className="text-4xl font-extrabold tracking-tight text-white">
            {value.toFixed(1)}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-0.5">
            {metric}
          </div>
        </div>

        {/* 0-10 Horizontal Gauge with Desirable Band & Purple REF Line */}
        <div className="mt-3 mb-5 px-1">
          <div className="flex justify-between text-[11px] font-semibold text-slate-400 mb-1">
            <span>0</span>
            <span className="text-emerald-400/90">
              Optimal {optimalRange[0].toFixed(1)}–{optimalRange[1].toFixed(1)}
            </span>
            <span>10</span>
          </div>

          <div className="relative h-4 rounded-md bg-slate-800 overflow-visible flex items-center">
            {/* Caution / Secondary Band */}
            <div
              className="absolute h-full bg-slate-700/70 rounded-sm"
              style={{
                left: `${Math.max(0, optStartPct - 12)}%`,
                width: `${Math.min(100, optWidthPct + 24)}%`,
              }}
            />
            {/* Green Desirable Range Band */}
            <div
              className="absolute h-full bg-emerald-500/30 border-x border-emerald-400/40"
              style={{
                left: `${optStartPct}%`,
                width: `${optWidthPct}%`,
              }}
            />

            {/* Dark Progress Fill Bar (Current Pitch Value) */}
            <div
              className="relative h-2.5 bg-slate-950 border border-slate-300/80 rounded-r-sm z-10 transition-all duration-300"
              style={{ width: `${pctValue}%` }}
            />

            {/* Vertical Purple REF Marker Line (Jordan's Sept 26 Design Addition 1) */}
            <div
              className="absolute -top-1.5 -bottom-4 w-0.5 bg-violet-400 z-20 transition-all duration-300 shadow-[0_0_8px_rgba(167,139,250,0.9)]"
              style={{ left: `${pctRef}%` }}
              title={`${refLabel}: ${refValue.toFixed(2)}`}
            >
              <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] font-extrabold tracking-wider text-violet-300 whitespace-nowrap bg-slate-950/90 px-1 rounded">
                REF
              </div>
            </div>
          </div>

          {/* REF Delta Sub-bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-5 pt-1 border-t border-slate-800/80">
            <span className="truncate max-w-[165px]" title={refLabel}>
              REF ({refLabel}): <strong className="text-violet-300">{refValue.toFixed(2)}</strong>
            </span>
            <span
              className={`font-mono font-semibold ${
                Math.abs(delta) < 0.15
                  ? 'text-slate-400'
                  : delta > 0
                  ? 'text-amber-300'
                  : 'text-sky-300'
              }`}
            >
              {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} vs REF
            </span>
          </div>
        </div>
      </div>

      {/* 18-Zone Mini Pitch Map (3 rows x 6 cols, matching Jordan's Sept 26 media_7.png) */}
      {showMiniPitch && (
        <div className="relative bg-slate-950/90 border-2 border-slate-700/80 rounded-xl p-2.5 overflow-hidden">
          {/* Subtle Soccer Pitch Markings SVG */}
          <svg
            viewBox="0 0 300 160"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
            preserveAspectRatio="none"
          >
            {/* Outer boundary */}
            <rect x="4" y="4" width="292" height="152" fill="none" stroke="#94a3b8" strokeWidth="2" />
            {/* Halfway line */}
            <line x1="150" y1="4" x2="150" y2="156" stroke="#94a3b8" strokeWidth="2" />
            {/* Center circle */}
            <circle cx="150" cy="80" r="26" fill="none" stroke="#94a3b8" strokeWidth="2" />
            {/* Left penalty area */}
            <rect x="4" y="34" width="42" height="92" fill="none" stroke="#94a3b8" strokeWidth="2" />
            <rect x="4" y="54" width="16" height="52" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Right penalty area */}
            <rect x="254" y="34" width="42" height="92" fill="none" stroke="#94a3b8" strokeWidth="2" />
            <rect x="280" y="54" width="16" height="52" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          </svg>

          <div className="relative z-10 flex flex-col gap-2">
            {rows.map((rowZones, rIdx) => (
              <div key={rIdx} className="grid grid-cols-6 gap-1.5 justify-items-center">
                {rowZones.map((z) => {
                  if (!z) return null;
                  const zVal = z.metrics[metric];
                  const zColor = getZoneStatusColor(metric, zVal);
                  const isSelected = selectedZone === z.zone;
                  return (
                    <button
                      key={z.zone}
                      type="button"
                      onClick={() => onSelectZone && onSelectZone(z.zone)}
                      title={`Zone ${z.zone} (Pos X=${z.posX}, Y=${z.posY}): ${metric} = ${zVal.toFixed(2)}`}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-md transition-transform ${
                        zColor.bg
                      } ${zColor.text} ${
                        isSelected
                          ? 'ring-2 ring-white scale-110 z-20'
                          : 'hover:scale-105 opacity-95 hover:opacity-100'
                      }`}
                    >
                      {zVal.toFixed(1)}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
