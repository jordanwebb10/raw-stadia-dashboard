import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Compass,
  Footprints,
  Gauge,
  Layers,
  Mail,
  RotateCcw,
  Sliders,
  Target,
} from 'lucide-react';
import {
  APPENDIX_A_DEFINITIONS,
  INGESTED_EMAIL_REPORTS,
  RAW_STADIA_KNOWLEDGE_SPECS,
} from '../data/rawStadiaKnowledge';
import { IndexName, PitchEvaluation, TrainingGoalName } from '../types/rawStadia';
import {
  ALL_INDEX_NAMES,
  computeTrainingGoals,
  getBootRecommendation,
  getZoneStatusColor,
  SNAKE_ZONE_COORDS,
  TRAINING_GOAL_INDEXES,
} from '../utils/rawStadiaEngine';

interface MobileFieldsideViewProps {
  evaluations: PitchEvaluation[];
  referenceBenchmarks: PitchEvaluation[];
  primaryEval: PitchEvaluation;
  compareEval: PitchEvaluation;
  refBaseline: PitchEvaluation;
  primaryId: string;
  compareId: string;
  refId: string;
  onSelectPrimary: (id: string) => void;
  onSelectCompare: (id: string) => void;
  onSelectRef: (id: string) => void;
  activeMetric: IndexName;
  onSelectMetric: (m: IndexName) => void;
  selectedZone: number | null;
  onSelectZone: (z: number) => void;
  isDesktopPreview?: boolean;
}

type MobileTab = 'briefing' | 'pitch' | 'radar' | 'history' | 'guide';

export const MobileFieldsideView: React.FC<MobileFieldsideViewProps> = ({
  evaluations,
  referenceBenchmarks,
  primaryEval,
  compareEval,
  refBaseline,
  primaryId,
  compareId,
  refId,
  onSelectPrimary,
  onSelectCompare,
  onSelectRef,
  activeMetric,
  onSelectMetric,
  selectedZone,
  onSelectZone,
  isDesktopPreview = false,
}) => {
  const [mobileTab, setMobileTab] = useState<MobileTab>('briefing');
  const [expandedMiniMap, setExpandedMiniMap] = useState<IndexName | null>('Grip');
  const [showSnake, setShowSnake] = useState<boolean>(false);
  const [deltaMode, setDeltaMode] = useState<boolean>(false);
  const [historyMode, setHistoryMode] = useState<'sessions' | 'emails'>('sessions');

  // Simulator state for mobile radar/sim tab
  const [simImpact, setSimImpact] = useState<number>(primaryEval.averages.Impact);
  const [simEnergy, setSimEnergy] = useState<number>(primaryEval.averages.Energy);
  const [simGrip, setSimGrip] = useState<number>(primaryEval.averages.Grip);

  const primaryBoot = getBootRecommendation(
    primaryEval.averages.Boot,
    primaryEval.hardwareMetrics.studDepthMm,
    primaryEval.averages.Grip
  );

  // Portrait 18-Zone Grid for Mobile:
  // 6 rows from Top Goal (Pos Y = 1) to Bottom Goal (Pos Y = 6)
  // 3 columns across pitch width (Pos X = 3 Left/North, Pos X = 2 Spine, Pos X = 1 Right/South)
  const portraitRows = [1, 2, 3, 4, 5, 6].map((posY) =>
    [3, 2, 1].map((posX) => primaryEval.zones.find((z) => z.posX === posX && z.posY === posY)!)
  );

  const activeZoneObj =
    primaryEval.zones.find((z) => z.zone === (selectedZone ?? 8)) || primaryEval.zones[7];
  const zoneMeta = SNAKE_ZONE_COORDS.find((c) => c.zone === activeZoneObj.zone);

  const simGoals = computeTrainingGoals(simImpact, simEnergy, simGrip);
  const simBootVal = Number(Math.max(1, Math.min(9, 10.1 - simGrip)).toFixed(2));
  const simBootRec = getBootRecommendation(simBootVal, undefined, simGrip);

  // Radar geometry
  const cx = 140;
  const cy = 140;
  const maxR = 95;
  const getRadarPt = (idx: number, val: number) => {
    const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
    const r = (Math.max(0, Math.min(10, val)) / 10) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };
  const makePoly = (scores: Record<TrainingGoalName, number>) =>
    TRAINING_GOAL_INDEXES.map((g, i) => {
      const p = getRadarPt(i, scores[g]);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(' ');

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 ${
        isDesktopPreview
          ? 'w-[412px] h-[840px] rounded-[42px] border-[8px] border-slate-800 shadow-2xl overflow-hidden mx-auto relative'
          : 'min-h-[calc(100vh-64px)] pb-20'
      }`}
    >
      {/* iPhone Dynamic Island notch when in desktop preview */}
      {isDesktopPreview && (
        <div className="bg-slate-950 pt-2 pb-1 flex justify-center shrink-0">
          <div className="w-28 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-between px-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-mono text-slate-400">FIELDSIDE</span>
          </div>
        </div>
      )}

      {/* Mobile Sticky Pitch & REF Selector Header */}
      <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-3.5 py-2.5 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 leading-none">
                USMNT Fieldside Mobile
              </div>
              <div className="text-xs font-bold text-white truncate max-w-[200px]">
                {primaryEval.pitchName}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const tmp = primaryId;
              onSelectPrimary(compareId);
              onSelectCompare(tmp);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 flex items-center gap-1 active:scale-95"
          >
            <ArrowLeftRight className="w-3 h-3 text-emerald-400" />
            Swap A/B
          </button>
        </div>

        {/* Compact 2-Column Dropdowns for Pitch A and REF Anchor */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <label className="text-[9px] font-bold uppercase text-emerald-400 block">
              Pitch A (Active)
            </label>
            <select
              value={primaryId}
              onChange={(e) => onSelectPrimary(e.target.value)}
              className="w-full bg-transparent text-[11px] font-bold text-white focus:outline-none truncate"
            >
              {evaluations.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-slate-900 text-white">
                  {ev.date.slice(5)} • {ev.pitchName}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-950/90 border border-slate-800 rounded-xl px-2.5 py-1.5">
            <label className="text-[9px] font-bold uppercase text-violet-400 block">
              Purple REF Line
            </label>
            <select
              value={refId}
              onChange={(e) => onSelectRef(e.target.value)}
              className="w-full bg-transparent text-[11px] font-bold text-violet-200 focus:outline-none truncate"
            >
              {referenceBenchmarks.map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.pitchName}
                </option>
              ))}
              <option value="USE_COMPARE_PITCH" className="bg-slate-900 text-white">
                Pitch B: {compareEval.pitchName}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Mobile Content Area */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3.5">
        {/* TAB 1: FIELDSIDE BRIEFING & REF GAUGES */}
        {mobileTab === 'briefing' && (
          <>
            {/* Top Fieldside Footwear & Condition Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/50 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {primaryEval.date} • {primaryEval.sessionObjective}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Uniformity: <strong className="text-white">{primaryEval.uniformityScore}%</strong>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 my-2">
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                    Recommended Boot Profile
                  </div>
                  <div className="text-base font-black text-white mt-0.5">{primaryBoot.name}</div>
                </div>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-lg border ${primaryBoot.badgeBg}`}>
                  {primaryBoot.code} ({primaryEval.averages.Boot.toFixed(1)})
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                {primaryEval.notes}
              </p>

              {/* 4 Physical Pill Readouts */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80 text-center font-mono">
                <div className="bg-slate-950/70 rounded-lg p-1.5">
                  <span className="text-[9px] text-slate-400 block">Hardness</span>
                  <strong className="text-xs text-amber-300">
                    {primaryEval.hardwareMetrics.hardnessGm}g
                  </strong>
                </div>
                <div className="bg-slate-950/70 rounded-lg p-1.5">
                  <span className="text-[9px] text-slate-400 block">Restitution</span>
                  <strong className="text-xs text-teal-300">
                    {primaryEval.hardwareMetrics.energyRestitutionPct}%
                  </strong>
                </div>
                <div className="bg-slate-950/70 rounded-lg p-1.5">
                  <span className="text-[9px] text-slate-400 block">Torque</span>
                  <strong className="text-xs text-violet-300">
                    {primaryEval.hardwareMetrics.rotationalResistanceNm}Nm
                  </strong>
                </div>
                <div className="bg-slate-950/70 rounded-lg p-1.5">
                  <span className="text-[9px] text-slate-400 block">Stud Depth</span>
                  <strong className="text-xs text-sky-300">
                    {primaryEval.hardwareMetrics.studDepthMm}mm
                  </strong>
                </div>
              </div>
            </div>

            {/* 3 Stacked 0-10 REF Gauges with Expandable 18-Zone Mini Maps */}
            {(
              [
                { m: 'Impact' as IndexName, opt: [4.0, 6.0] as [number, number], sub: 'Firmness & Compaction' },
                { m: 'Energy' as IndexName, opt: [3.8, 5.5] as [number, number], sub: 'Elastic Energy Return' },
                { m: 'Grip' as IndexName, opt: [5.5, 7.2] as [number, number], sub: 'Rotational Traction' },
              ] as const
            ).map(({ m, opt, sub }) => {
              const val = primaryEval.averages[m];
              const rVal = refBaseline.averages[m];
              const delta = Number((val - rVal).toFixed(2));
              const pctVal = Math.max(0, Math.min(100, (val / 10) * 100));
              const pctRef = Math.max(0, Math.min(100, (rVal / 10) * 100));
              const optLeft = (opt[0] / 10) * 100;
              const optW = ((opt[1] - opt[0]) / 10) * 100;
              const badge = getZoneStatusColor(m, val);
              const isExp = expandedMiniMap === m;

              return (
                <div
                  key={m}
                  className="bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        {sub}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-white">{val.toFixed(1)}</span>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                          {m}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          badge.status === 'optimal'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : badge.status === 'critical'
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                            : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                        }`}
                      >
                        {badge.label}
                      </span>
                      <div className="text-[11px] font-mono text-violet-300 mt-1">
                        {delta > 0 ? `+${delta}` : delta} vs REF ({rVal.toFixed(1)})
                      </div>
                    </div>
                  </div>

                  {/* 0-10 Gauge Bar with Purple REF Line */}
                  <div className="mt-3 mb-4">
                    <div className="relative h-3.5 rounded bg-slate-800 flex items-center">
                      <div
                        className="absolute h-full bg-emerald-500/30 border-x border-emerald-400/40"
                        style={{ left: `${optLeft}%`, width: `${optW}%` }}
                      />
                      <div
                        className="relative h-2 bg-slate-950 border border-slate-200 rounded-r-sm z-10"
                        style={{ width: `${pctVal}%` }}
                      />
                      <div
                        className="absolute -top-1.5 -bottom-3.5 w-0.5 bg-violet-400 z-20 shadow-[0_0_6px_rgba(167,139,250,0.9)]"
                        style={{ left: `${pctRef}%` }}
                      >
                        <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-black text-violet-300 bg-slate-950 px-1 rounded">
                          REF
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Toggle for 18-Zone Mini Map */}
                  <button
                    type="button"
                    onClick={() => setExpandedMiniMap(isExp ? null : m)}
                    className="w-full pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 hover:text-slate-200"
                  >
                    <span>
                      18-Zone {m} Distribution (Range {primaryEval.mins[m].toFixed(1)}–
                      {primaryEval.maxs[m].toFixed(1)})
                    </span>
                    {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExp && (
                    <div className="mt-2.5 bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                      {[3, 2, 1].map((posX) => (
                        <div key={posX} className="grid grid-cols-6 gap-1.5 my-1 justify-items-center">
                          {[1, 2, 3, 4, 5, 6].map((posY) => {
                            const z = primaryEval.zones.find(
                              (zn) => zn.posX === posX && zn.posY === posY
                            )!;
                            const zv = z.metrics[m];
                            const zc = getZoneStatusColor(m, zv);
                            return (
                              <button
                                key={z.zone}
                                type="button"
                                onClick={() => {
                                  onSelectZone(z.zone);
                                  onSelectMetric(m);
                                  setMobileTab('pitch');
                                }}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold ${zc.bg} ${zc.text}`}
                              >
                                {zv.toFixed(1)}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Hotspot Alert Strip */}
            {primaryEval.hotspots.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3.5">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {primaryEval.hotspots.length} Localized Surface Hotspot(s) Flagged
                </div>
                <div className="space-y-1.5">
                  {primaryEval.hotspots.slice(0, 3).map((h, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        onSelectZone(h.zone);
                        onSelectMetric(h.metric);
                        setMobileTab('pitch');
                      }}
                      className="w-full text-left bg-slate-950/80 border border-rose-500/30 rounded-xl p-2 text-[11px] text-slate-200"
                    >
                      <strong className="text-rose-300">
                        Zone {h.zone} ({h.metric} {h.value.toFixed(1)}):
                      </strong>{' '}
                      {h.reason}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: PORTRAIT 18-ZONE PITCH MAP (Goal-to-Goal Vertical Orientation for Mobile!) */}
        {mobileTab === 'pitch' && (
          <>
            {/* Scrollable Metric Layer Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
              {ALL_INDEX_NAMES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMetric(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border ${
                    activeMetric === m
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  {m} ({primaryEval.averages[m].toFixed(1)})
                </button>
              ))}
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowSnake(!showSnake)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 ${
                  showSnake
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                {showSnake ? 'Hide Walk (1→18)' : 'Snake Path (1→18)'}
              </button>
              <button
                type="button"
                onClick={() => setDeltaMode(!deltaMode)}
                className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 ${
                  deltaMode
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                {deltaMode ? 'Showing Δ vs REF' : 'Show Δ vs REF'}
              </button>
            </div>

            {/* Vertical (Portrait) Soccer Pitch Container (3 cols x 6 rows) */}
            <div className="relative rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-b from-emerald-950/75 via-slate-950 to-emerald-950/75 p-3 shadow-inner">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-emerald-300/70 mb-1.5 px-1">
                <span>Pos X=3 (North/Gym)</span>
                <span>↑ Left Goal (Y=1)</span>
                <span>Pos X=1 (South/Bench)</span>
              </div>

              <div className="relative py-2">
                {/* Portrait Soccer Pitch Markings SVG */}
                <svg
                  viewBox="0 0 300 480"
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  preserveAspectRatio="none"
                >
                  <rect
                    x="8"
                    y="8"
                    width="284"
                    height="464"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="2"
                  />
                  {/* Halfway horizontal line */}
                  <line
                    x1="8"
                    y1="240"
                    x2="292"
                    y2="240"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="150"
                    cy="240"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="2"
                  />
                  {/* Top Penalty Box */}
                  <rect
                    x="65"
                    y="8"
                    width="170"
                    height="68"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="2"
                  />
                  {/* Bottom Penalty Box */}
                  <rect
                    x="65"
                    y="404"
                    width="170"
                    height="68"
                    fill="none"
                    stroke="rgba(255,255,255,0.22)"
                    strokeWidth="2"
                  />

                  {showSnake && (
                    <polyline
                      fill="none"
                      stroke="rgba(52, 211, 153, 0.65)"
                      strokeWidth="3"
                      strokeDasharray="5 4"
                      points={SNAKE_ZONE_COORDS.map((c) => {
                        const colIdx = 3 - c.posX; // X=3->0, X=2->1, X=1->2
                        const px = 8 + (colIdx + 0.5) * (284 / 3);
                        const py = 8 + (c.posY - 0.5) * (464 / 6);
                        return `${px},${py}`;
                      }).join(' ')}
                    />
                  )}
                </svg>

                {/* 6 Rows (Y=1..6) x 3 Columns (X=3,2,1) */}
                <div className="relative z-10 flex flex-col gap-2.5">
                  {portraitRows.map((rowZones, rIdx) => (
                    <div key={rIdx} className="grid grid-cols-3 gap-3 justify-items-center">
                      {rowZones.map((z) => {
                        const val = z.metrics[activeMetric];
                        const rVal =
                          refBaseline.zones.find((rz) => rz.zone === z.zone)?.metrics[
                            activeMetric
                          ] ?? val;
                        const diff = Number((val - rVal).toFixed(1));
                        const cs = getZoneStatusColor(activeMetric, val);
                        const isSel = activeZoneObj.zone === z.zone;
                        return (
                          <button
                            key={z.zone}
                            type="button"
                            onClick={() => onSelectZone(z.zone)}
                            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-md transition-transform ${
                              cs.bg
                            } ${cs.border} ${cs.text} ${
                              isSel ? 'ring-4 ring-white scale-110 z-20' : 'active:scale-95'
                            }`}
                          >
                            <span className="text-[8px] font-bold opacity-80 leading-none">
                              Z{z.zone}
                            </span>
                            <span className="text-sm font-black leading-tight">
                              {deltaMode ? (diff > 0 ? `+${diff}` : diff) : val.toFixed(1)}
                            </span>
                            <span className="text-[8px] font-mono opacity-75 leading-none">
                              ({z.posX},{z.posY})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center text-[9px] font-bold uppercase tracking-wider text-emerald-300/70 mt-1.5">
                ↓ Right Goal Third (Pos Y = 6) • Tap any zone to inspect
              </div>
            </div>

            {/* Selected Zone Bottom Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-400 block">
                    Selected Zone Inspector
                  </span>
                  <h4 className="text-sm font-extrabold text-white">
                    Zone {activeZoneObj.zone} • Pos ({activeZoneObj.posX}, {activeZoneObj.posY})
                  </h4>
                  <p className="text-[11px] text-slate-400">{zoneMeta?.label}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-400 block">{activeMetric}</span>
                  <strong className="text-xl text-emerald-400">
                    {activeZoneObj.metrics[activeMetric].toFixed(2)}
                  </strong>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[11px] pt-2 border-t border-slate-800">
                {(['Impact', 'Energy', 'Grip', 'Boot', 'Reaction'] as IndexName[]).map((k) => (
                  <div key={k} className="bg-slate-950 rounded-lg p-1.5">
                    <span className="text-[9px] text-slate-400 block">{k}</span>
                    <strong className="text-white">{activeZoneObj.metrics[k].toFixed(1)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 3: RADAR & WHAT-IF SIMULATOR */}
        {mobileTab === 'radar' && (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5 mb-1">
                <Target className="w-4 h-4 text-emerald-400" />
                6-Axis Training Goal Suitability Radar
              </h3>
              <p className="text-[11px] text-slate-400 mb-2">
                Emerald: <strong>{primaryEval.pitchName}</strong> • Violet:{' '}
                <strong>{refBaseline.pitchName}</strong>
              </p>

              <div className="flex justify-center">
                <svg viewBox="0 0 280 280" className="w-full max-w-[250px] h-auto">
                  {[2, 4, 6, 8, 10].map((lvl) => (
                    <polygon
                      key={lvl}
                      points={TRAINING_GOAL_INDEXES.map((_, i) => {
                        const p = getRadarPt(i, lvl);
                        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                      }).join(' ')}
                      fill="none"
                      stroke="rgba(148,163,184,0.18)"
                    />
                  ))}
                  {TRAINING_GOAL_INDEXES.map((g, i) => {
                    const ep = getRadarPt(i, 10);
                    const lp = getRadarPt(i, 12.1);
                    return (
                      <g key={g}>
                        <line
                          x1={cx}
                          y1={cy}
                          x2={ep.x}
                          y2={ep.y}
                          stroke="rgba(148,163,184,0.2)"
                        />
                        <text
                          x={lp.x}
                          y={lp.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-slate-200 text-[10px] font-bold"
                        >
                          {g}
                        </text>
                      </g>
                    );
                  })}
                  <polygon
                    points={makePoly(refBaseline.averages)}
                    fill="rgba(167,139,250,0.08)"
                    stroke="#a78bfa"
                    strokeWidth="1.75"
                    strokeDasharray="4 3"
                  />
                  <polygon
                    points={makePoly(primaryEval.averages)}
                    fill="rgba(16,185,129,0.28)"
                    stroke="#10b981"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                {TRAINING_GOAL_INDEXES.map((g) => (
                  <div
                    key={g}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-2 text-center font-mono"
                  >
                    <span className="text-[10px] text-slate-400 block font-sans">{g}</span>
                    <strong className="text-sm text-emerald-400">
                      {primaryEval.averages[g].toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Touch Formula Simulator */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-violet-400" />
                  Fieldside "What-If" Simulator
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSimImpact(primaryEval.averages.Impact);
                    setSimEnergy(primaryEval.averages.Energy);
                    setSimGrip(primaryEval.averages.Grip);
                  }}
                  className="text-[11px] text-slate-300 bg-slate-800 px-2 py-1 rounded-lg flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Impact</span>
                  <strong className="font-mono text-emerald-400">{simImpact.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="9.0"
                  step="0.05"
                  value={simImpact}
                  onChange={(e) => setSimImpact(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Energy</span>
                  <strong className="font-mono text-teal-400">{simEnergy.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="9.0"
                  step="0.05"
                  value={simEnergy}
                  onChange={(e) => setSimEnergy(parseFloat(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span>Grip</span>
                  <strong className="font-mono text-violet-400">{simGrip.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min="2.5"
                  max="9.5"
                  step="0.05"
                  value={simGrip}
                  onChange={(e) => setSimGrip(parseFloat(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800 font-mono text-center">
                {TRAINING_GOAL_INDEXES.map((g) => (
                  <div key={g} className="bg-slate-950 rounded-lg p-1.5">
                    <span className="text-[9px] text-slate-400 block font-sans">{g}</span>
                    <strong className="text-xs text-white">{simGoals[g].toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
                <span className="text-slate-400">Simulated Cleat:</span>
                <span className={`font-bold px-2 py-0.5 rounded border ${simBootRec.badgeBg}`}>
                  {simBootRec.name}
                </span>
              </div>
            </div>
          </>
        )}

        {/* TAB 4: CAMP SESSIONS & EMAIL REPORTS */}
        {mobileTab === 'history' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setHistoryMode('sessions')}
                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                  historyMode === 'sessions'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> 23 Pitch Sessions
              </button>
              <button
                type="button"
                onClick={() => setHistoryMode('emails')}
                className={`py-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 ${
                  historyMode === 'emails'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-800'
                }`}
              >
                <Mail className="w-3.5 h-3.5" /> 11 Camp Reports
              </button>
            </div>

            {historyMode === 'sessions' ? (
              <div className="space-y-2.5">
                {evaluations.map((ev) => {
                  const isA = ev.id === primaryId;
                  const bRec = getBootRecommendation(
                    ev.averages.Boot,
                    ev.hardwareMetrics.studDepthMm,
                    ev.averages.Grip
                  );
                  return (
                    <div
                      key={ev.id}
                      onClick={() => {
                        onSelectPrimary(ev.id);
                        setMobileTab('briefing');
                      }}
                      className={`p-3.5 rounded-2xl border cursor-pointer ${
                        isA
                          ? 'bg-emerald-500/15 border-emerald-500/50'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {ev.date} • {ev.sessionObjective}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${bRec.badgeBg}`}>
                          {bRec.code}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white">{ev.pitchName}</div>
                      <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800/80 font-mono text-xs">
                        <div>
                          <span className="text-[9px] text-slate-400 block">Impact</span>
                          <strong>{ev.averages.Impact.toFixed(2)}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">Energy</span>
                          <strong>{ev.averages.Energy.toFixed(2)}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block">Grip</span>
                          <strong>{ev.averages.Grip.toFixed(2)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2.5">
                {INGESTED_EMAIL_REPORTS.map((em) => (
                  <div
                    key={em.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">{em.date}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans">
                        {em.sessionObjective}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white">{em.subject}</div>
                    <div className="text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2">
                      {em.recommendedPitch}
                    </div>
                    <ul className="text-[11px] text-slate-300 list-disc list-inside space-y-1">
                      {em.keyTakeaways.map((k, i) => (
                        <li key={i}>{k}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 5: POCKET EXPERT GUIDE & APPENDIX A */}
        {mobileTab === 'guide' && (
          <div className="space-y-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <h3 className="text-sm font-bold text-white mb-1">
                Appendix A — Surface Definitions
              </h3>
              <p className="text-[11px] text-slate-400 mb-3">
                Quick fieldside reference for Raw Stadia &amp; FIFA physical metrics
              </p>
              <div className="space-y-2.5">
                {APPENDIX_A_DEFINITIONS.map((d) => (
                  <div
                    key={d.term}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <strong className="text-xs text-white">{d.term}</strong>
                      <span className="text-[10px] font-mono text-emerald-400">
                        Opt: {d.optimalBand}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">{d.definition}</p>
                  </div>
                ))}
              </div>
            </div>

            {RAW_STADIA_KNOWLEDGE_SPECS.slice(0, 4).map((sp) => (
              <div
                key={sp.name}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-black text-white">{sp.name.toUpperCase()}</span>
                  <span className="text-[10px] font-mono text-emerald-400">{sp.unitOrScale}</span>
                </div>
                <p className="text-[11px] italic text-slate-300">“{sp.quote}”</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-2">
                    <strong className="text-sky-300 block">{sp.lowSpectrum.title}</strong>
                    <span className="text-slate-300 block mt-0.5">
                      Use: {sp.lowSpectrum.recommendedUse}
                    </span>
                    <span className="text-rose-300 block">
                      Risk: {sp.lowSpectrum.injuryRiskFocus}
                    </span>
                  </div>
                  <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-2">
                    <strong className="text-emerald-300 block">{sp.highSpectrum.title}</strong>
                    <span className="text-slate-300 block mt-0.5">
                      Use: {sp.highSpectrum.recommendedUse}
                    </span>
                    <span className="text-rose-300 block">
                      Risk: {sp.highSpectrum.injuryRiskFocus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Thumb-Zone Navigation Bar */}
      <nav
        className={`${
          isDesktopPreview ? 'sticky bottom-0' : 'fixed bottom-0 left-0 right-0 z-40'
        } bg-slate-950/95 backdrop-blur border-t border-slate-800 px-2 py-1.5 grid grid-cols-5 gap-1`}
      >
        {[
          { id: 'briefing' as MobileTab, label: 'Fieldside', icon: Gauge },
          { id: 'pitch' as MobileTab, label: '18-Zone', icon: Compass },
          { id: 'radar' as MobileTab, label: 'Radar/Sim', icon: Target },
          { id: 'history' as MobileTab, label: 'Camp Log', icon: Calendar },
          { id: 'guide' as MobileTab, label: 'Guide', icon: BookOpen },
        ].map((item) => {
          const Icon = item.icon;
          const active = mobileTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMobileTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
                active ? 'text-emerald-400 bg-emerald-500/10 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
