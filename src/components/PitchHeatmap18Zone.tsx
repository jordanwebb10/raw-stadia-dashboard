import React, { useState } from 'react';
import { AlertTriangle, Compass, Eye, Footprints, Layers, Sparkles } from 'lucide-react';
import { IndexName, PitchEvaluation } from '../types/rawStadia';
import {
  ALL_INDEX_NAMES,
  getBootRecommendation,
  getZoneStatusColor,
  SNAKE_ZONE_COORDS,
} from '../utils/rawStadiaEngine';

interface PitchHeatmap18ZoneProps {
  evaluation: PitchEvaluation;
  comparisonEval?: PitchEvaluation | null;
  activeMetric: IndexName;
  onSelectMetric: (m: IndexName) => void;
  selectedZone: number | null;
  onSelectZone: (z: number) => void;
}

export const PitchHeatmap18Zone: React.FC<PitchHeatmap18ZoneProps> = ({
  evaluation,
  comparisonEval,
  activeMetric,
  onSelectMetric,
  selectedZone,
  onSelectZone,
}) => {
  const [showSnakePath, setShowSnakePath] = useState<boolean>(false);
  const [deltaMode, setDeltaMode] = useState<boolean>(false);

  // 3 rows (Pos X = 3 Top, 2 Center, 1 Bottom) x 6 cols (Pos Y = 1..6 Left to Right)
  const gridRows = [3, 2, 1].map((posX) =>
    [1, 2, 3, 4, 5, 6].map((posY) => evaluation.zones.find((z) => z.posX === posX && z.posY === posY)!)
  );

  const activeZoneObj =
    evaluation.zones.find((z) => z.zone === (selectedZone ?? 8)) || evaluation.zones[7];
  const compZoneObj = comparisonEval?.zones.find((z) => z.zone === activeZoneObj.zone);
  const zoneCoordMeta = SNAKE_ZONE_COORDS.find((c) => c.zone === activeZoneObj.zone);
  const zoneBootRec = getBootRecommendation(
    activeZoneObj.metrics.Boot,
    evaluation.hardwareMetrics.studDepthMm,
    activeZoneObj.metrics.Grip
  );

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
                18-Zone Spatial Surface Intelligence Map — {evaluation.pitchName}
              </h3>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5 font-medium">
              {evaluation.venue} • Date: <strong className="text-[#2E3440]">{evaluation.date}</strong> •
              Session Objective: <strong className="text-[#001489]">{evaluation.sessionObjective}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
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

            {comparisonEval && (
              <button
                type="button"
                onClick={() => setDeltaMode(!deltaMode)}
                className={`px-3 py-1.5 rounded-[7px] text-xs font-bold border flex items-center gap-1.5 transition-all ${
                  deltaMode
                    ? 'bg-purple-50 border-purple-500 text-purple-800'
                    : 'bg-[#F8F9FA] border-[#CBD5E1] text-[#2E3440] hover:border-[#C69214]'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-purple-600" />
                {deltaMode ? `Showing Δ vs ${comparisonEval.pitchName}` : 'Zone Δ vs REF'}
              </button>
            )}
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] mr-1">
            Active Layer:
          </span>
          {ALL_INDEX_NAMES.map((m) => {
            const isAct = activeMetric === m;
            const isPerf = m === 'Impact' || m === 'Energy' || m === 'Grip';
            return (
              <button
                key={m}
                type="button"
                onClick={() => onSelectMetric(m)}
                className={`px-2.5 py-1 rounded-[6px] text-xs transition-all border ${
                  isAct
                    ? 'bg-[#001489] text-white border-[#C69214] shadow-sm font-extrabold'
                    : isPerf
                    ? 'bg-[#F8FAFC] text-[#2E3440] border-[#CBD5E1] font-bold hover:border-[#C69214]'
                    : 'bg-white text-[#64748B] border-[#E2E8F0] font-semibold hover:border-[#CBD5E1] hover:text-[#2E3440]'
                }`}
              >
                {m} ({evaluation.averages[m].toFixed(1)})
              </button>
            );
          })}
        </div>

        {/* Full Soccer Pitch Visual Container (Matching mnt-data-management green pitch canvas) */}
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
                    const delta = Number((val - compVal).toFixed(2));
                    const colorSpec = getZoneStatusColor(activeMetric, val);
                    const isSelected = activeZoneObj.zone === z.zone;
                    const hasHotspot = evaluation.hotspots.some((h) => h.zone === z.zone);

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
                          {deltaMode && comparisonEval
                            ? delta > 0
                              ? `+${delta.toFixed(1)}`
                              : delta.toFixed(1)
                            : val.toFixed(1)}
                        </span>

                        {/* Coordinates sub-label */}
                        <span className="text-[8px] font-mono opacity-80 leading-none">
                          ({z.posX},{z.posY})
                        </span>

                        {/* Hotspot Alert Badge */}
                        {hasHotspot && (
                          <span
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#DA291C] border border-white flex items-center justify-center text-white text-[10px] font-black shadow"
                            title="Localized Surface Hotspot"
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
              Optimal / Desirable Range
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-amber-300" />
              Caution / Watch Band
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-600 inline-block border border-rose-300" />
              Critical Hotspot (Grip ≥ 8.0 or Impact ≥ 7.1)
            </span>
          </div>
          <div className="font-mono text-[#2E3440]">
            Pitch Mean: <strong>{evaluation.averages[activeMetric].toFixed(2)}</strong> • SD:{' '}
            <strong>±{evaluation.stdDevs[activeMetric].toFixed(2)}</strong> • Range:{' '}
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

          {/* Core Performance Triad in this Zone */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {(['Impact', 'Energy', 'Grip'] as IndexName[]).map((m) => {
              const zv = activeZoneObj.metrics[m];
              const rv = compZoneObj ? compZoneObj.metrics[m] : evaluation.averages[m];
              const diff = Number((zv - rv).toFixed(2));
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
                  <div className="text-lg font-black text-[#2E3440]">{zv.toFixed(2)}</div>
                  <div className="text-[10px] font-mono text-[#64748B] font-semibold">
                    {diff >= 0 ? `+${diff}` : diff} vs {compZoneObj ? 'REF' : 'Mean'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Zone Boot Recommendation */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold text-[#2E3440] flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-[#C69214]" />
                Zone {activeZoneObj.zone} Footwear Profile
              </span>
              <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${zoneBootRec.badgeBg}`}>
                {zoneBootRec.code} ({activeZoneObj.metrics.Boot.toFixed(2)})
              </span>
            </div>
            <div className="text-xs font-bold text-[#001489]">{zoneBootRec.name}</div>
            <p className="text-[11px] text-[#434C5E] mt-0.5 leading-relaxed">
              {zoneBootRec.rationale}
            </p>
          </div>

          {/* 6 Training Goal Scores in this Zone */}
          <div>
            <div className="text-xs font-extrabold uppercase tracking-[0.06em] text-[#64748B] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C69214]" />
              Zone {activeZoneObj.zone} Training Goal Suitability (0–10)
            </div>
            <div className="space-y-2">
              {(['Speed', 'Reaction', 'Power', 'Recovery', 'Metabolic', 'Endurance'] as IndexName[]).map(
                (tg) => {
                  const val = activeZoneObj.metrics[tg];
                  return (
                    <div
                      key={tg}
                      onClick={() => onSelectMetric(tg)}
                      className="cursor-pointer group flex items-center gap-2"
                    >
                      <span className="w-20 text-xs font-bold text-[#434C5E] group-hover:text-[#001489]">
                        {tg}
                      </span>
                      <div className="flex-1 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#001489] to-[#C69214] rounded-full"
                          style={{ width: `${Math.min(100, (val / 10) * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-mono font-bold text-[#2E3440]">
                        {val.toFixed(2)}
                      </span>
                    </div>
                  );
                }
              )}
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
              Localized Surface Hotspots ({evaluation.hotspots.length})
            </h4>
            <span className="text-xs font-mono font-bold text-[#64748B]">
              Uniformity: {evaluation.uniformityScore}/100
            </span>
          </div>

          {evaluation.hotspots.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-[8px] p-3 text-xs text-emerald-900 font-medium">
              All 18 zones on <strong>{evaluation.pitchName}</strong> fall within desirable biomechanical
              bounds (no Grip spikes ≥ 8.0 or extreme Impact anomalies detected).
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
