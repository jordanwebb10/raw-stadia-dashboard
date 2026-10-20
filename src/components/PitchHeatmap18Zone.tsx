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
      <div className="xl:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        {/* Controls Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">
                18-Zone Spatial Surface Intelligence Map — {evaluation.pitchName}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {evaluation.venue} • Date: <strong className="text-slate-200">{evaluation.date}</strong> •
              Session Objective: <strong className="text-emerald-400">{evaluation.sessionObjective}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSnakePath(!showSnakePath)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                showSnakePath
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              {showSnakePath ? 'Hide Tester Walk (1→18)' : 'Show Tester Snake Path (1→18)'}
            </button>

            {comparisonEval && (
              <button
                type="button"
                onClick={() => setDeltaMode(!deltaMode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                  deltaMode
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {deltaMode ? `Showing Δ vs ${comparisonEval.pitchName}` : 'Zone Δ vs REF'}
              </button>
            )}
          </div>
        </div>

        {/* Metric Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
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
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                  isAct
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm font-bold'
                    : isPerf
                    ? 'bg-slate-800/90 text-slate-200 border-slate-700 hover:border-slate-500'
                    : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {m} ({evaluation.averages[m].toFixed(1)})
              </button>
            );
          })}
        </div>

        {/* Full Soccer Pitch Visual Container */}
        <div className="relative rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-950/70 via-slate-950/90 to-emerald-950/70 p-4 sm:p-6 overflow-hidden shadow-inner">
          {/* Pitch Orientation Labels */}
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-emerald-300/70 mb-2 px-2">
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
                  fill={col % 2 === 0 ? 'rgba(16, 185, 129, 0.04)' : 'rgba(6, 78, 59, 0.08)'}
                />
              ))}
              {/* Outer pitch lines */}
              <rect
                x="10"
                y="10"
                width="580"
                height="300"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2.5"
              />
              {/* Halfway line */}
              <line
                x1="300"
                y1="10"
                x2="300"
                y2="310"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2.5"
              />
              {/* Center circle & spot */}
              <circle
                cx="300"
                cy="160"
                r="52"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2.5"
              />
              <circle cx="300" cy="160" r="3.5" fill="rgba(255,255,255,0.35)" />
              {/* Left Penalty Box & 6-Yard Box */}
              <rect
                x="10"
                y="68"
                width="88"
                height="184"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2.5"
              />
              <rect
                x="10"
                y="112"
                width="32"
                height="96"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              {/* Right Penalty Box & 6-Yard Box */}
              <rect
                x="502"
                y="68"
                width="88"
                height="184"
                fill="none"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="2.5"
              />
              <rect
                x="558"
                y="112"
                width="32"
                height="96"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />

              {/* Optional Technician Snake Walk Path (Zones 1 -> 18) */}
              {showSnakePath && (
                <polyline
                  fill="none"
                  stroke="rgba(52, 211, 153, 0.55)"
                  strokeWidth="3"
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
                            ? 'ring-4 ring-white scale-110 z-20'
                            : 'hover:scale-105 opacity-95 hover:opacity-100'
                        }`}
                      >
                        {/* Zone Number Pill */}
                        <span className="text-[9px] font-bold uppercase tracking-tighter opacity-80 leading-none">
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
                        <span className="text-[8px] font-mono opacity-75 leading-none">
                          ({z.posX},{z.posY})
                        </span>

                        {/* Hotspot Alert Badge */}
                        {hasHotspot && (
                          <span
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 border border-white flex items-center justify-center text-white shadow"
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

          <div className="flex flex-wrap justify-between items-center text-[10px] font-bold uppercase tracking-widest text-emerald-300/70 mt-2 px-2">
            <span>Pos Y: 1 → 6 (Lengthwise Thirds)</span>
            <span>South / Bottom Touchline (Pos X = 1) • Team Benches Side</span>
            <span>Uniformity Score: {evaluation.uniformityScore}%</span>
          </div>
        </div>

        {/* Legend & Summary Footer */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
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
          <div className="font-mono text-slate-300">
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Zone Diagnostic Inspector
              </span>
              <h4 className="text-lg font-extrabold text-white">
                Zone {activeZoneObj.zone} • Pos ({activeZoneObj.posX}, {activeZoneObj.posY})
              </h4>
              <p className="text-xs text-slate-400">{zoneCoordMeta?.label}</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400">Active ({activeMetric})</div>
              <div className="text-2xl font-black text-emerald-400">
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
                  className={`cursor-pointer p-2.5 rounded-xl border transition-all ${
                    activeMetric === m
                      ? 'bg-emerald-500/15 border-emerald-500/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase text-slate-400">{m}</div>
                  <div className="text-lg font-extrabold text-white">{zv.toFixed(2)}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {diff >= 0 ? `+${diff}` : diff} vs {compZoneObj ? 'REF' : 'Mean'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Zone Boot Recommendation */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-emerald-400" />
                Zone {activeZoneObj.zone} Footwear Profile
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${zoneBootRec.badgeBg}`}>
                {zoneBootRec.code} ({activeZoneObj.metrics.Boot.toFixed(2)})
              </span>
            </div>
            <div className="text-xs font-semibold text-white">{zoneBootRec.name}</div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {zoneBootRec.rationale}
            </p>
          </div>

          {/* 6 Training Goal Scores in this Zone */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
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
                      <span className="w-20 text-xs font-semibold text-slate-300 group-hover:text-emerald-300">
                        {tg}
                      </span>
                      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          style={{ width: `${Math.min(100, (val / 10) * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-mono font-bold text-white">
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
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Localized Surface Hotspots ({evaluation.hotspots.length})
            </h4>
            <span className="text-xs font-mono text-slate-400">
              Uniformity: {evaluation.uniformityScore}/100
            </span>
          </div>

          {evaluation.hotspots.length === 0 ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs text-emerald-200">
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
                  className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                    h.severity === 'critical'
                      ? 'bg-rose-500/10 border-rose-500/40 hover:bg-rose-500/20'
                      : 'bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={h.severity === 'critical' ? 'text-rose-300' : 'text-amber-300'}>
                      Zone {h.zone} (Pos {h.posX},{h.posY}) • {h.metric}: {h.value.toFixed(2)}
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-slate-950/60 text-slate-300">
                      Inspect Zone
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">{h.reason}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
