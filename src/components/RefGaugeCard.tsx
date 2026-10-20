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
    <div
      className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col justify-between transition-all hover:border-[#C69214]"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      {/* Top Numeric Header */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B]">
            {subtitle || 'Raw Stadia Index'}
          </span>
          <span
            className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
              badge.status === 'optimal'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : badge.status === 'critical'
                ? 'bg-red-50 border-red-300 text-[#DA291C]'
                : 'bg-amber-50 border-amber-300 text-amber-800'
            }`}
          >
            {badge.label}
          </span>
        </div>

        <div className="text-center my-2.5">
          <div className="text-4xl font-black tracking-tight text-[#2E3440]">
            {value.toFixed(1)}
          </div>
          <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#001489] mt-0.5">
            {metric}
          </div>
        </div>

        {/* 0-10 Horizontal Gauge with Desirable Band & Purple REF Line */}
        <div className="mt-3 mb-5 px-1">
          <div className="flex justify-between text-[11px] font-bold text-[#64748B] mb-1">
            <span>0</span>
            <span className="text-emerald-700 font-extrabold">
              Optimal {optimalRange[0].toFixed(1)}–{optimalRange[1].toFixed(1)}
            </span>
            <span>10</span>
          </div>

          <div className="relative h-4 rounded-md bg-[#F1F5F9] border border-[#CBD5E1] overflow-visible flex items-center">
            {/* Caution / Secondary Band */}
            <div
              className="absolute h-full bg-[#E2E8F0] rounded-sm"
              style={{
                left: `${Math.max(0, optStartPct - 12)}%`,
                width: `${Math.min(100, optWidthPct + 24)}%`,
              }}
            />
            {/* Green Desirable Range Band */}
            <div
              className="absolute h-full bg-emerald-500/25 border-x border-emerald-500/60"
              style={{
                left: `${optStartPct}%`,
                width: `${optWidthPct}%`,
              }}
            />

            {/* Navy Progress Fill Bar (Current Pitch Value) */}
            <div
              className="relative h-2.5 bg-[#001489] border border-[#1E3A8A] rounded-r-sm z-10 transition-all duration-300"
              style={{ width: `${pctValue}%` }}
            />

            {/* Vertical Purple REF Marker Line (Jordan's Sept 26 Design Addition 1) */}
            <div
              className="absolute -top-1.5 -bottom-4 w-0.5 bg-purple-600 z-20 transition-all duration-300 shadow-[0_0_6px_rgba(124,58,237,0.6)]"
              style={{ left: `${pctRef}%` }}
              title={`${refLabel}: ${refValue.toFixed(2)}`}
            >
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-extrabold tracking-wider text-purple-800 whitespace-nowrap bg-purple-50 border border-purple-300 px-1 rounded">
                REF
              </div>
            </div>
          </div>

          {/* REF Delta Sub-bar */}
          <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-5 pt-2 border-t border-[#E2E8F0]">
            <span className="truncate max-w-[175px] font-semibold" title={refLabel}>
              REF ({refLabel}): <strong className="text-purple-700 font-extrabold">{refValue.toFixed(2)}</strong>
            </span>
            <span
              className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                Math.abs(delta) < 0.15
                  ? 'bg-[#F1F5F9] text-[#434C5E]'
                  : delta > 0
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-blue-50 text-[#001489] border border-blue-200'
              }`}
            >
              {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} vs REF
            </span>
          </div>
        </div>
      </div>

      {/* 18-Zone Mini Pitch Map (3 rows x 6 cols, lush green turf canvas matching mnt-data-management pitch export) */}
      {showMiniPitch && (
        <div
          className="relative rounded-[10px] p-2.5 overflow-hidden border-2 border-[#15803D]"
          style={{
            background: 'linear-gradient(180deg, #166534 0%, #14532D 50%, #166534 100%)',
          }}
        >
          {/* Crisp White Soccer Pitch Markings SVG */}
          <svg
            viewBox="0 0 300 160"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
            preserveAspectRatio="none"
          >
            {/* Outer boundary */}
            <rect x="4" y="4" width="292" height="152" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            {/* Halfway line */}
            <line x1="150" y1="4" x2="150" y2="156" stroke="#FFFFFF" strokeWidth="2" />
            {/* Center circle */}
            <circle cx="150" cy="80" r="26" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            {/* Left penalty area */}
            <rect x="4" y="34" width="42" height="92" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="4" y="54" width="16" height="52" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
            {/* Right penalty area */}
            <rect x="254" y="34" width="42" height="92" fill="none" stroke="#FFFFFF" strokeWidth="2" />
            <rect x="280" y="54" width="16" height="52" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
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
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-md border transition-transform ${
                        zColor.bg
                      } ${zColor.border} ${zColor.text} ${
                        isSelected
                          ? 'ring-2 ring-[#C69214] scale-110 z-20'
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
