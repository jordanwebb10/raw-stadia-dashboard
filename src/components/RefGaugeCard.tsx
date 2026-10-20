import React from 'react';
import { IndexName, PitchZone } from '../types/rawStadia';
import { getMagnitudeAssessment, getZoneStatusColor } from '../utils/rawStadiaEngine';
import { MetricInfoTrigger } from './AppendixAModal';

interface RefGaugeCardProps {
  metric: IndexName;
  value: number;
  refValue: number;
  refLabel: string;
  optimalRange: [number, number];
  zones: PitchZone[];
  selectedZone?: number | null;
  onSelectZone?: (zoneNum: number) => void;
  onOpenAppendixA?: (metricKey: string) => void;
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
  onOpenAppendixA,
  showMiniPitch = true,
  subtitle,
}) => {
  const pctValue = Math.max(0, Math.min(100, (value / 10) * 100));
  const pctRef = Math.max(0, Math.min(100, (refValue / 10) * 100));
  const optStartPct = (optimalRange[0] / 10) * 100;
  const optWidthPct = ((optimalRange[1] - optimalRange[0]) / 10) * 100;

  const bridgeLeftPct = Math.min(pctValue, pctRef);
  const bridgeWidthPct = Math.abs(pctValue - pctRef);

  const mag = getMagnitudeAssessment(metric, value, refValue, 'idx');

  // Compute 18-zone min, max, and SD for concrete within-pitch spread
  const zoneVals = zones.map((z) => z.metrics[metric]);
  const zMin = Math.min(...zoneVals);
  const zMax = Math.max(...zoneVals);
  const zMean = zoneVals.reduce((a, b) => a + b, 0) / (zoneVals.length || 1);
  const zSd = Math.sqrt(
    zoneVals.reduce((acc, v) => acc + (v - zMean) ** 2, 0) / (zoneVals.length || 1)
  );

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
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B]">
              {subtitle || 'Raw Stadia Index'}
            </span>
            {onOpenAppendixA && (
              <MetricInfoTrigger metricKey={metric} onOpenModal={onOpenAppendixA} />
            )}
          </div>
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

        <div className="text-center my-2">
          <div className="text-4xl font-black tracking-tight text-[#2E3440]">
            {value.toFixed(1)}
          </div>
          <div className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#001489] mt-0.5">
            {metric}
          </div>
        </div>

        {/* 0-10 Horizontal Gauge with Optimal Band, Visual Delta Bridge & Purple REF Line */}
        <div className="mt-2.5 mb-4 px-1">
          <div className="flex justify-between text-[11px] font-bold text-[#64748B] mb-1">
            <span>0</span>
            <span className="text-emerald-700 font-extrabold">
              Optimal {optimalRange[0].toFixed(1)}–{optimalRange[1].toFixed(1)}
            </span>
            <span>10</span>
          </div>

          <div className="relative h-5 rounded-md bg-[#F1F5F9] border border-[#CBD5E1] overflow-visible flex items-center">
            {/* Green Desirable Range Band */}
            <div
              className="absolute h-full bg-emerald-500/25 border-x border-emerald-500/60"
              style={{
                left: `${optStartPct}%`,
                width: `${optWidthPct}%`,
              }}
              title={`Optimal Range: ${optimalRange[0]}–${optimalRange[1]}`}
            />

            {/* Navy Progress Fill Bar (Current Pitch Value) */}
            <div
              className="relative h-2.5 bg-[#001489] rounded-l-sm z-10 transition-all duration-300"
              style={{ width: `${pctValue}%` }}
            />

            {/* Visual Delta Connector Bridge between Purple REF and Pitch A */}
            {bridgeWidthPct > 1.2 && (
              <div
                className="absolute h-3.5 top-1/2 -translate-y-1/2 z-15 rounded-sm border border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden"
                style={{
                  left: `${bridgeLeftPct}%`,
                  width: `${bridgeWidthPct}%`,
                  backgroundColor:
                    mag.band === 'large'
                      ? 'rgba(218, 41, 28, 0.22)'
                      : mag.band === 'moderate'
                      ? 'rgba(198, 146, 20, 0.28)'
                      : 'rgba(0, 20, 137, 0.16)',
                  borderColor: mag.barColor,
                }}
                title={`Magnitude Gap vs REF: ${mag.summaryText}`}
              />
            )}

            {/* Pitch A Current Value Pin */}
            <div
              className="absolute w-3.5 h-3.5 rounded-full bg-[#001489] border-2 border-white shadow-md z-20 -translate-x-1/2 transition-all duration-300"
              style={{ left: `${pctValue}%` }}
              title={`Pitch A (${metric}): ${value.toFixed(2)}`}
            />

            {/* Vertical Purple REF Marker Line (Jordan's Sept 26 Design Addition 1) */}
            <div
              className="absolute -top-1.5 -bottom-4 w-0.5 bg-purple-600 z-20 transition-all duration-300 shadow-[0_0_6px_rgba(124,58,237,0.6)]"
              style={{ left: `${pctRef}%` }}
              title={`${refLabel}: ${refValue.toFixed(2)}`}
            >
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-extrabold tracking-wider text-purple-800 whitespace-nowrap bg-purple-50 border border-purple-300 px-1 rounded">
                REF {refValue.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Standardized Magnitude & Biomechanical Meaning Box (Replaces uncontextualized raw diff) */}
          <div className="mt-6 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-[#64748B]">
                Magnitude vs. REF
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${mag.badgeClass}`}
              >
                {mag.summaryText}
              </span>
            </div>
            <p className="text-[11px] text-[#434C5E] font-medium leading-snug">
              {mag.clinicalNote}
            </p>
            <div className="pt-1 border-t border-[#E2E8F0] flex items-center justify-between text-[10px] font-mono text-[#64748B]">
              <span>18-Zone Spread:</span>
              <strong className="text-[#2E3440]">
                {zMin.toFixed(1)}–{zMax.toFixed(1)} (±{zSd.toFixed(2)} SD)
              </strong>
            </div>
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
