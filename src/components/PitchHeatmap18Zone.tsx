import React, { useState } from 'react';
import { AlertTriangle, Compass, Eye, Layers, ShieldAlert } from 'lucide-react';
import { IndexName, PitchEvaluation, ReferenceBaselineProfile } from '../types/rawStadia';
import { RAW_STADIA_INDEX_SPECS } from '../data/rawStadiaKnowledge';
import {
  CORE_INDEX_NAMES,
  getZoneStatusColor,
  SNAKE_ZONE_COORDS,
} from '../utils/rawStadiaEngine';

interface PitchHeatmap18ZoneProps {
  evaluation: PitchEvaluation;
  comparisonEval?: PitchEvaluation | null;
  referenceProfile: ReferenceBaselineProfile;
  activeMetric: IndexName;
  onSelectMetric: (m: IndexName) => void;
  selectedZone: number | null;
  onSelectZone: (z: number) => void;
}

export const PitchHeatmap18Zone: React.FC<PitchHeatmap18ZoneProps> = ({
  evaluation,
  comparisonEval,
  referenceProfile,
  activeMetric,
  onSelectMetric,
  selectedZone,
  onSelectZone,
}) => {
  const [showSnakePath, setShowSnakePath] = useState<boolean>(false);
  const [deltaMode, setDeltaMode] = useState<'single' | 'vs-b' | 'vs-ref'>('single');

  // 3 rows (Pos X = 3 Top, 2 Center, 1 Bottom) x 6 cols (Pos Y = 1..6 Left to Right)
  const gridRows = [3, 2, 1].map((posX) =>
    [1, 2, 3, 4, 5, 6].map((posY) => evaluation.zones.find((z) => z.posX === posX && z.posY === posY)!)
  );

  const activeZoneObj =
    evaluation.zones.find((z) => z.zone === (selectedZone ?? 8)) || evaluation.zones[7];
  const compZoneObj = comparisonEval?.zones.find((z) => z.zone === activeZoneObj.zone);
  const zoneCoordMeta = SNAKE_ZONE_COORDS.find((c) => c.zone === activeZoneObj.zone);
  const activeRefStats = referenceProfile.metrics[activeMetric];
  const activeSpec = RAW_STADIA_INDEX_SPECS.find((s) => s.index === activeMetric) || RAW_STADIA_INDEX_SPECS[0];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* Left 8 Columns: Interactive 18-Zone Pitch Map */}
      <div
        className="xl:col-span-8 bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col justify-between"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        {/* Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5E9F0]">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#C69214]" />
              <h3 className="text-lg font-extrabold text-[#2E3440]">
                18-Zone Spatial Surface Map — {evaluation.pitchName}
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              {evaluation.venue} • Date: <strong className="text-[#2E3440]">{evaluation.date}</strong> •
              Session Context: <strong className="text-[#001489]">{evaluation.sessionObjective}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSnakePath(!showSnakePath)}
              className={`px-3 py-1.5 rounded-[7px] text-xs font-bold border flex items-center gap-1.5 transition-all ${
                showSnakePath
                  ? 'bg-[#EFF6FF] border-[#001489] text-[#001489]'
                  : 'bg-[#F8F9FA] border-[#CBD5E1] text-[#2E3440] hover:border-[#C69214]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#C69214]" />
              {showSnakePath ? 'Hide Tester Walk (1→18)' : 'Show Tester Snake Path (1→18)'}
            </button>

            <div className="inline-flex rounded-[7px] bg-[#F8FAFC] border border-[#CBD5E1] p-0.5">
              <button
                type="button"
                onClick={() => setDeltaMode('single')}
                className={`px-2.5 py-1 rounded-[5px] text-xs font-bold transition-all ${
                  deltaMode === 'single'
                    ? 'bg-[#001489] text-white'
                    : 'text-[#434C5E] hover:text-[#001489]'
                }`}
              >
                Pitch A Values
              </button>
              {comparisonEval && (
                <button
                  type="button"
                  onClick={() => setDeltaMode('vs-b')}
                  className={`px-2.5 py-1 rounded-[5px] text-xs font-bold transition-all flex items-center gap-1 ${
                    deltaMode === 'vs-b'
                      ? 'bg-[#C69214] text-white'
                      : 'text-[#434C5E] hover:text-[#C69214]'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  Δ vs Pitch B
                </button>
              )}
              <button
                type="button"
                onClick={() => setDeltaMode('vs-ref')}
                className={`px-2.5 py-1 rounded-[5px] text-xs font-bold transition-all ${
                  deltaMode === 'vs-ref'
                    ? 'bg-purple-700 text-white'
                    : 'text-[#434C5E] hover:text-purple-700'
                }`}
              >
                Δ vs REF ({activeRefStats.mean.toFixed(1)})
              </button>
            </div>
          </div>
        </div>

        {/* 3 Core Playing Surface Indexes Selector Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] mr-1">
              Playing Surface Index:
            </span>
            {CORE_INDEX_NAMES.map((m) => {
              const isAct = activeMetric === m;
              const spec = RAW_STADIA_INDEX_SPECS.find((s) => s.index === m)!;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMetric(m)}
                  className={`px-3 py-1.5 rounded-[7px] text-xs transition-all border flex items-center gap-2 ${
                    isAct
                      ? 'bg-[#001489] text-white border-[#C69214] shadow-sm font-extrabold'
                      : 'bg-[#F8FAFC] text-[#2E3440] border-[#CBD5E1] font-bold hover:border-[#C69214]'
                  }`}
                >
                  <span>
                    {m} ({evaluation.averages[m].toFixed(2)} ± {evaluation.stdDevs[m].toFixed(2)})
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      isAct ? 'bg-white/15 text-amber-200' : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    {spec.leftSpectrum.title.replace(' FIELD', '')} ↔{' '}
                    {spec.rightSpectrum.title.replace(' FIELD', '')}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded">
            REF Band ({referenceProfile.shortLabel}): [{activeRefStats.bandLow.toFixed(2)} –{' '}
            {activeRefStats.bandHigh.toFixed(2)}]
          </span>
        </div>

        {/* Full Soccer Pitch Visual Container */}
        <div
          className="relative rounded-[12px] border-2 border-[#15803D] p-4 sm:p-6 overflow-hidden shadow-inner"
          style={{
            background: 'linear-gradient(180deg, #166534 0%, #14532D 50%, #166534 100%)',
          }}
        >
          {/* Pitch Orientation Labels */}
          <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-emerald-100/90 mb-2 px-2">
            <span>← Left Goal Third (Pos Y = 1)</span>
            <span>North / Top Touchline (Pos X = 3) • Gym / Camera Side</span>
            <span>Right Goal Third (Pos Y = 6) →</span>
          </div>

          {/* Pitch Markings & Optional Snake Walk SVG Overlay */}
          <div className="relative py-4 px-2">
            <svg
              viewBox="0 0 600 320"
              className="absolute inset-0 w-full h-full pointer-events-none"
              preserveAspectRatio="none"
            >
              {/* Alternating turf mowing stripes */}
              {[0, 1, 2, 3, 4, 5].map((col) => (
                <rect
                  key={col}
                  x={10 + col * 96.6}
                  y="10"
                  width="96.6"
                  height="300"
                  fill={col % 2 === 0 ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.08)'}
                />
              ))}
              {/* Outer pitch lines */}
              <rect
                x="10"
                y="10"
                width="580"
                height="300"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2.5"
              />
              {/* Halfway line */}
              <line
                x1="300"
                y1="10"
                x2="300"
                y2="310"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2.5"
              />
              {/* Center circle & spot */}
              <circle
                cx="300"
                cy="160"
                r="52"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2.5"
              />
              <circle cx="300" cy="160" r="3.5" fill="rgba(255,255,255,0.65)" />
              {/* Left Penalty Box & 6-Yard Box */}
              <rect
                x="10"
                y="68"
                width="88"
                height="184"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2.5"
              />
              <rect
                x="10"
                y="112"
                width="32"
                height="96"
                fill="none"
                stroke="rgba(255,255,255,0.38)"
                strokeWidth="2"
              />
              {/* Right Penalty Box & 6-Yard Box */}
              <rect
                x="502"
                y="68"
                width="88"
                height="184"
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="2.5"
              />
              <rect
                x="558"
                y="112"
                width="32"
                height="96"
                fill="none"
                stroke="rgba(255,255,255,0.38)"
                strokeWidth="2"
              />

              {/* Optional Technician Snake Walk Path (Zones 1 -> 18) */}
              {showSnakePath && (
                <polyline
                  fill="none"
                  stroke="#FDE047"
                  strokeWidth="3.5"
                  strokeDasharray="6 4"
                  points={SNAKE_ZONE_COORDS.map((c) => {
                    const cx = 10 + (c.posY - 0.5) * (580 / 6);
                    const rowIdx = 3 - c.posX; // X=3->0, X=2->1, X=1->2
                    const cy = 10 + (rowIdx + 0.5) * (300 / 3);
                    return `${cx},${cy}`;
                  }).join(' ')}
                />
              )}
            </svg>

            {/* 3x6 Interactive Zone Grid */}
            <div className="relative z-10 flex flex-col gap-5 py-2">
              {gridRows.map((rowZones, rIdx) => (
                <div key={rIdx} className="grid grid-cols-6 gap-2 sm:gap-4 justify-items-center">
                  {rowZones.map((z) => {
                    const val = z.metrics[activeMetric];
                    const compVal =
                      comparisonEval?.zones.find((cz) => cz.zone === z.zone)?.metrics[activeMetric] ??
                      val;
                    const deltaVsB = Number((val - compVal).toFixed(2));
                    const deltaVsRef = Number((val - activeRefStats.mean).toFixed(2));
                    const colorSpec = getZoneStatusColor(activeMetric, val, activeRefStats);
                    const isSelected = activeZoneObj.zone === z.zone;
                    const hasHotspot = evaluation.hotspots.some((h) => h.zone === z.zone);

                    let displayStr = val.toFixed(1);
                    if (deltaMode === 'vs-b' && comparisonEval) {
                      displayStr = deltaVsB > 0 ? `+${deltaVsB.toFixed(1)}` : deltaVsB.toFixed(1);
                    } else if (deltaMode === 'vs-ref') {
                      displayStr = deltaVsRef > 0 ? `+${deltaVsRef.toFixed(1)}` : deltaVsRef.toFixed(1);
                    }

                    return (
                      <button
                        key={z.zone}
                        type="button"
                        onClick={() => onSelectZone(z.zone)}
                        className={`group relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex flex-col items-center justify-center border-2 shadow-lg transition-all ${
                          colorSpec.bg
                        } ${colorSpec.border} ${colorSpec.text} ${
                          isSelected
                            ? 'ring-4 ring-[#C69214] scale-110 z-20'
                            : 'hover:scale-105 opacity-95 hover:opacity-100'
                        }`}
                      >
                        {/* Zone Number Pill */}
                        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-85 leading-none">
                          Z{z.zone}
                        </span>

                        {/* Primary Value or Delta */}
                        <span className="text-base sm:text-lg font-extrabold leading-tight">
                          {displayStr}
                        </span>

                        {/* Coordinates sub-label */}
                        <span className="text-[8px] font-mono opacity-80 leading-none">
                          ({z.posX},{z.posY})
                        </span>

                        {/* Hotspot Alert Badge */}
                        {hasHotspot && (
                          <span
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DA291C] border border-white flex items-center justify-center text-white text-[10px] font-black shadow"
                            title="Localized Surface Outlier"
                          >
                            !
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-emerald-100/90 mt-2 px-2">
            <span>Pos Y: 1 → 6 (Lengthwise Thirds)</span>
            <span>South / Bottom Touchline (Pos X = 1) • Team Benches Side</span>
            <span>Uniformity Score: {evaluation.uniformityScore}%</span>
          </div>
        </div>

        {/* Legend & Summary Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B] font-semibold">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block border border-emerald-300" />
              Within Reference Band ([{activeRefStats.bandLow.toFixed(1)}–{activeRefStats.bandHigh.toFixed(1)}])
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-amber-300" />
              Outside ±1 SD Watch Band
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 inline-block border border-rose-300" />
              Extreme Spectrum Zone (Grip ≥ 8.0 or Impact ≥ 7.1)
            </span>
          </div>
          <div className="font-mono text-[#2E3440]">
            Pitch Mean: <strong>{evaluation.averages[activeMetric].toFixed(2)}</strong> • SD:{' '}
            <strong>±{evaluation.stdDevs[activeMetric].toFixed(2)}</strong> • 18-Zone Range:{' '}
            <strong>
              {evaluation.mins[activeMetric].toFixed(1)}–{evaluation.maxs[activeMetric].toFixed(1)}
            </strong>
          </div>
        </div>
      </div>

      {/* Right 4 Columns: Selected Zone Diagnostic Inspector + Hotspots */}
      <div className="xl:col-span-4 flex flex-col gap-5">
        {/* Zone Diagnostic Card */}
        <div
          className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex items-center justify-between border-b border-[#E5E9F0] pb-3 mb-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#C69214]">
                Zone Diagnostic Inspector
              </span>
              <h4 className="text-lg font-black text-[#2E3440]">
                Zone {activeZoneObj.zone} • Pos ({activeZoneObj.posX}, {activeZoneObj.posY})
              </h4>
              <p className="text-xs text-[#64748B] font-medium">{zoneCoordMeta?.label}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#64748B] font-bold">Active ({activeMetric})</div>
              <div className="text-2xl font-black text-[#001489]">
                {activeZoneObj.metrics[activeMetric].toFixed(2)}
              </div>
            </div>
          </div>

          {/* 3 Core Playing Surface Indexes in this Zone */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {CORE_INDEX_NAMES.map((m) => {
              const zv = activeZoneObj.metrics[m];
              const bv = compZoneObj ? compZoneObj.metrics[m] : null;
              const refMean = referenceProfile.metrics[m].mean;
              const diffVsRef = Number((zv - refMean).toFixed(2));
              const diffVsB = bv !== null ? Number((zv - bv).toFixed(2)) : null;

              return (
                <div
                  key={m}
                  onClick={() => onSelectMetric(m)}
                  className={`cursor-pointer p-2.5 rounded-[8px] border transition-all ${
                    activeMetric === m
                      ? 'bg-[#EFF6FF] border-[#001489]'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#C69214]'
                  }`}
                >
                  <div className="text-[10px] font-extrabold uppercase text-[#64748B]">{m}</div>
                  <div className="text-lg font-black text-[#2E3440] font-mono">{zv.toFixed(2)}</div>
                  {diffVsB !== null && bv !== null && (
                    <div className="text-[10px] font-mono text-[#C69214] font-bold">
                      {diffVsB >= 0 ? `+${diffVsB}` : diffVsB} vs B ({bv.toFixed(1)})
                    </div>
                  )}
                  <div className="text-[10px] font-mono text-purple-700 font-semibold">
                    {diffVsRef >= 0 ? `+${diffVsRef}` : diffVsRef} vs REF ({refMean.toFixed(1)})
                  </div>
                </div>
              );
            })}
          </div>

          {/* Raw Stadia PDF Spectrum Position for Active Metric in this Zone */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#001489]">
                {activeSpec.index} Spectrum ({activeSpec.mechanicalProperty})
              </span>
              <span className="text-[10px] font-mono font-bold text-[#64748B]">
                Zone Z{activeZoneObj.zone}: {activeZoneObj.metrics[activeMetric].toFixed(2)} / 10
              </span>
            </div>

            {/* Spectrum Visual Bar */}
            <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden my-2 border border-slate-300">
              <div
                className="absolute top-0 bottom-0 bg-emerald-500/25 border-x border-emerald-600/50"
                style={{
                  left: `${(activeRefStats.bandLow / 10) * 100}%`,
                  width: `${((activeRefStats.bandHigh - activeRefStats.bandLow) / 10) * 100}%`,
                }}
              />
              <div
                className="absolute top-0 bottom-0 w-2.5 -ml-1.25 rounded-full bg-[#001489] border border-white shadow"
                style={{
                  left: `${Math.max(3, Math.min(97, (activeZoneObj.metrics[activeMetric] / 10) * 100))}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 text-[10px]">
              <div className="bg-white border border-[#E2E8F0] rounded p-2">
                <div className="font-black text-[#2E3440] uppercase">
                  ← {activeSpec.leftSpectrum.title}
                </div>
                <div className="text-[#434C5E] mt-0.5">
                  Effect: <strong>{activeSpec.leftSpectrum.effectOnPlayer}</strong>
                </div>
                <div className="text-[#001489] mt-0.5 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 shrink-0 text-[#C69214]" />
                  Watch: {activeSpec.leftSpectrum.suggestedInjuryWatch}
                </div>
              </div>
              <div className="bg-white border border-[#E2E8F0] rounded p-2">
                <div className="font-black text-[#2E3440] uppercase text-right">
                  {activeSpec.rightSpectrum.title} →
                </div>
                <div className="text-[#434C5E] mt-0.5 text-right">
                  Effect: <strong>{activeSpec.rightSpectrum.effectOnPlayer}</strong>
                </div>
                <div className="text-[#DA291C] mt-0.5 font-semibold text-right">
                  Watch: {activeSpec.rightSpectrum.suggestedInjuryWatch}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Automated Grounds & Clinical Hotspot Alerts */}
        <div
          className="bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex-1"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-extrabold uppercase tracking-[0.06em] text-[#2E3440] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DA291C]" />
              Localized Zone Outliers ({evaluation.hotspots.length})
            </h4>
            <span className="text-xs font-mono font-bold text-[#64748B]">
              Uniformity: {evaluation.uniformityScore}/100
            </span>
          </div>

          {evaluation.hotspots.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-[8px] p-3 text-xs text-emerald-900 font-medium">
              All 18 zones on <strong>{evaluation.pitchName}</strong> fall within standard bounds for{' '}
              <strong>Impact</strong>, <strong>Energy</strong>, and <strong>Grip</strong>.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {evaluation.hotspots.map((h, i) => (
                <button
                  key={`${h.zone}-${h.metric}-${i}`}
                  type="button"
                  onClick={() => {
                    onSelectZone(h.zone);
                    onSelectMetric(h.metric);
                  }}
                  className={`w-full text-left p-2.5 rounded-[8px] border transition-colors ${
                    h.severity === 'critical'
                      ? 'bg-red-50 border-red-300 hover:bg-red-100/70'
                      : 'bg-amber-50 border-amber-300 hover:bg-amber-100/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className={h.severity === 'critical' ? 'text-[#DA291C]' : 'text-amber-900'}>
                      Zone {h.zone} (Pos {h.posX},{h.posY}) • {h.metric}: {h.value.toFixed(2)}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#2E3440]">
                      Inspect Zone
                    </span>
                  </div>
                  <p className="text-[11px] text-[#434C5E] mt-1 font-medium">{h.reason}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
