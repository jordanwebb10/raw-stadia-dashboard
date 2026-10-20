import React, { useState } from 'react';
import {
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
  Shield,
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
      className={`flex flex-col bg-[#F8FAFC] text-[#2E3440] ${
        isDesktopPreview
          ? 'w-[412px] h-[840px] rounded-[42px] border-[8px] border-[#2E3440] shadow-2xl overflow-hidden mx-auto relative'
          : 'min-h-screen pb-20'
      }`}
    >
      {/* iPhone Dynamic Island notch when in desktop preview */}
      {isDesktopPreview && (
        <div className="bg-white pt-2 pb-1 flex justify-center shrink-0 border-b border-[#E5E9F0]">
          <div className="w-32 h-5 rounded-full bg-[#2E3440] flex items-center justify-between px-3">
            <span
              className="w-2 h-2 rounded-full bg-[#C69214]"
              style={{ boxShadow: '0 0 6px rgba(198, 146, 20, 0.8)' }}
            />
            <span className="text-[9px] font-mono font-bold text-white tracking-wider">
              USSF FIELDSIDE
            </span>
          </div>
        </div>
      )}

      {/* Mobile Sticky Pitch & REF Selector Header (mnt-data-management TopBar & Sidebar brand styling) */}
      <div className="bg-white border-b border-[#E5E9F0] px-3.5 py-2.5 shrink-0 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-[#C69214]"
              style={{
                background: 'linear-gradient(135deg, #001489 0%, #1E3A8A 100%)',
                boxShadow: '0 2px 6px rgba(0, 20, 137, 0.2)',
              }}
            >
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.04em] text-[#C69214] leading-none">
                Sport Science Hub • Fieldside
              </div>
              <div className="text-xs font-black text-[#2E3440] truncate max-w-[205px] mt-0.5">
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
            className="px-2.5 py-1 rounded-[6px] bg-[#F8F9FA] border border-[#CBD5E1] hover:border-[#C69214] text-[11px] font-bold text-[#2E3440] flex items-center gap-1 active:scale-95"
          >
            <ArrowLeftRight className="w-3 h-3 text-[#C69214]" />
            Swap A/B
          </button>
        </div>

        {/* Compact 2-Column Dropdowns for Pitch A and REF Anchor (matching SidebarNav.tsx inputs) */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#F8F9FA] border border-[#CBD5E1] rounded-[6px] px-2.5 py-1">
            <label className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-[#64748B] block">
              1. Pitch A (Active)
            </label>
            <select
              value={primaryId}
              onChange={(e) => onSelectPrimary(e.target.value)}
              className="w-full bg-transparent text-[11px] font-bold text-[#1E293B] focus:outline-none truncate"
            >
              {evaluations.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-white text-[#1E293B]">
                  {ev.date.slice(5)} • {ev.pitchName}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#F8F9FA] border border-[#CBD5E1] rounded-[6px] px-2.5 py-1">
            <label className="text-[9px] font-extrabold uppercase tracking-[0.05em] text-purple-700 block">
              2. Purple REF Line
            </label>
            <select
              value={refId}
              onChange={(e) => onSelectRef(e.target.value)}
              className="w-full bg-transparent text-[11px] font-bold text-purple-900 focus:outline-none truncate"
            >
              {referenceBenchmarks.map((r) => (
                <option key={r.id} value={r.id} className="bg-white text-[#1E293B]">
                  {r.pitchName}
                </option>
              ))}
              <option value="USE_COMPARE_PITCH" className="bg-white text-[#1E293B]">
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
            <div
              className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#C69214] rounded-[10px] p-4"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.05em] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#001489] border border-[#BFDBFE]">
                  {primaryEval.date} • {primaryEval.sessionObjective}
                </span>
                <span className="text-[11px] font-mono font-bold text-[#64748B]">
                  Uniformity: <strong className="text-[#2E3440]">{primaryEval.uniformityScore}%</strong>
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 my-2">
                <div>
                  <div className="text-[10px] uppercase font-extrabold text-[#64748B] flex items-center gap-1">
                    <Footprints className="w-3.5 h-3.5 text-[#C69214]" />
                    Recommended Boot Profile
                  </div>
                  <div className="text-base font-black text-[#2E3440] mt-0.5">{primaryBoot.name}</div>
                </div>
                <span className={`text-xs font-extrabold px-2.5 py-1 rounded-[6px] border ${primaryBoot.badgeBg}`}>
                  {primaryBoot.code} ({primaryEval.averages.Boot.toFixed(1)})
                </span>
              </div>

              <p className="text-[11px] text-[#434C5E] font-medium leading-relaxed mt-1">
                {primaryEval.notes}
              </p>

              {/* 4 Physical Pill Readouts */}
              <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-[#E5E9F0] text-center font-mono">
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-1.5">
                  <span className="text-[9px] text-[#64748B] font-sans font-bold block">Hardness</span>
                  <strong className="text-xs text-[#92400E]">
                    {primaryEval.hardwareMetrics.hardnessGm}g
                  </strong>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-1.5">
                  <span className="text-[9px] text-[#64748B] font-sans font-bold block">Restitution</span>
                  <strong className="text-xs text-emerald-700">
                    {primaryEval.hardwareMetrics.energyRestitutionPct}%
                  </strong>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-1.5">
                  <span className="text-[9px] text-[#64748B] font-sans font-bold block">Torque</span>
                  <strong className="text-xs text-purple-700">
                    {primaryEval.hardwareMetrics.rotationalResistanceNm}Nm
                  </strong>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-1.5">
                  <span className="text-[9px] text-[#64748B] font-sans font-bold block">Stud Depth</span>
                  <strong className="text-xs text-[#001489]">
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
                  className="bg-white border border-[#E2E8F0] rounded-[10px] p-4"
                  style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] block">
                        {sub}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#2E3440]">{val.toFixed(1)}</span>
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#001489]">
                          {m}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          badge.status === 'optimal'
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                            : badge.status === 'critical'
                            ? 'bg-red-50 border-red-300 text-[#DA291C]'
                            : 'bg-amber-50 border-amber-300 text-amber-800'
                        }`}
                      >
                        {badge.label}
                      </span>
                      <div className="text-[11px] font-mono font-bold text-purple-700 mt-1">
                        {delta > 0 ? `+${delta}` : delta} vs REF ({rVal.toFixed(1)})
                      </div>
                    </div>
                  </div>

                  {/* 0-10 Gauge Bar with Purple REF Line */}
                  <div className="mt-3 mb-4">
                    <div className="relative h-3.5 rounded bg-[#F1F5F9] border border-[#CBD5E1] flex items-center">
                      <div
                        className="absolute h-full bg-emerald-500/25 border-x border-emerald-500/60"
                        style={{ left: `${optLeft}%`, width: `${optW}%` }}
                      />
                      <div
                        className="relative h-2 bg-[#001489] border border-[#1E3A8A] rounded-r-sm z-10"
                        style={{ width: `${pctVal}%` }}
                      />
                      <div
                        className="absolute -top-1.5 -bottom-3.5 w-0.5 bg-purple-600 z-20 shadow-[0_0_6px_rgba(124,58,237,0.6)]"
                        style={{ left: `${pctRef}%` }}
                      >
                        <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] font-black text-purple-800 bg-purple-50 border border-purple-300 px-1 rounded">
                          REF
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accordion Toggle for 18-Zone Mini Map */}
                  <button
                    type="button"
                    onClick={() => setExpandedMiniMap(isExp ? null : m)}
                    className="w-full pt-2 border-t border-[#E5E9F0] flex items-center justify-between text-[11px] font-bold text-[#64748B] hover:text-[#2E3440]"
                  >
                    <span>
                      18-Zone {m} Distribution (Range {primaryEval.mins[m].toFixed(1)}–
                      {primaryEval.maxs[m].toFixed(1)})
                    </span>
                    {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {isExp && (
                    <div
                      className="mt-2.5 border-2 border-[#15803D] rounded-[8px] p-2.5"
                      style={{
                        background: 'linear-gradient(180deg, #166534 0%, #14532D 50%, #166534 100%)',
                      }}
                    >
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
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold border shadow ${zc.bg} ${zc.border} ${zc.text}`}
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
              <div className="bg-red-50 border border-red-300 rounded-[10px] p-3.5">
                <div className="text-xs font-extrabold text-[#DA291C] flex items-center gap-1.5 mb-1.5">
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
                      className="w-full text-left bg-white border border-red-200 rounded-[8px] p-2 text-[11px] text-[#2E3440] font-medium"
                    >
                      <strong className="text-[#DA291C]">
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
                  className={`px-2.5 py-1 rounded-[6px] text-xs whitespace-nowrap border ${
                    activeMetric === m
                      ? 'bg-[#001489] text-white border-[#C69214] font-extrabold'
                      : 'bg-white text-[#434C5E] border-[#CBD5E1] font-bold'
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
                className={`flex-1 py-1.5 px-2.5 rounded-[7px] text-[11px] font-bold border flex items-center justify-center gap-1 ${
                  showSnake
                    ? 'bg-[#EFF6FF] border-[#001489] text-[#001489]'
                    : 'bg-white border-[#CBD5E1] text-[#2E3440]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#C69214]" />
                {showSnake ? 'Hide Walk (1→18)' : 'Snake Path (1→18)'}
              </button>
              <button
                type="button"
                onClick={() => setDeltaMode(!deltaMode)}
                className={`flex-1 py-1.5 px-2.5 rounded-[7px] text-[11px] font-bold border flex items-center justify-center gap-1 ${
                  deltaMode
                    ? 'bg-purple-50 border-purple-500 text-purple-800'
                    : 'bg-white border-[#CBD5E1] text-[#2E3440]'
                }`}
              >
                {deltaMode ? 'Showing Δ vs REF' : 'Show Δ vs REF'}
              </button>
            </div>

            {/* Vertical (Portrait) Soccer Pitch Container (3 cols x 6 rows) */}
            <div
              className="relative rounded-[12px] border-2 border-[#15803D] p-3 shadow-inner"
              style={{
                background: 'linear-gradient(180deg, #166534 0%, #14532D 50%, #166534 100%)',
              }}
            >
              <div className="flex justify-between text-[9px] font-extrabold uppercase tracking-wider text-emerald-100/90 mb-1.5 px-1">
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
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="2"
                  />
                  {/* Halfway horizontal line */}
                  <line
                    x1="8"
                    y1="240"
                    x2="292"
                    y2="240"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="150"
                    cy="240"
                    r="42"
                    fill="none"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="2"
                  />
                  {/* Top Penalty Box */}
                  <rect
                    x="65"
                    y="8"
                    width="170"
                    height="68"
                    fill="none"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="2"
                  />
                  {/* Bottom Penalty Box */}
                  <rect
                    x="65"
                    y="404"
                    width="170"
                    height="68"
                    fill="none"
                    stroke="rgba(255,255,255,0.45)"
                    strokeWidth="2"
                  />

                  {showSnake && (
                    <polyline
                      fill="none"
                      stroke="#FDE047"
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
                              isSel ? 'ring-4 ring-[#C69214] scale-110 z-20' : 'active:scale-95'
                            }`}
                          >
                            <span className="text-[8px] font-bold opacity-85 leading-none">
                              Z{z.zone}
                            </span>
                            <span className="text-sm font-black leading-tight">
                              {deltaMode ? (diff > 0 ? `+${diff}` : diff) : val.toFixed(1)}
                            </span>
                            <span className="text-[8px] font-mono opacity-80 leading-none">
                              ({z.posX},{z.posY})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center text-[9px] font-extrabold uppercase tracking-wider text-emerald-100/90 mt-1.5">
                ↓ Right Goal Third (Pos Y = 6) • Tap any zone to inspect
              </div>
            </div>

            {/* Selected Zone Bottom Card */}
            <div
              className="bg-white border border-[#E2E8F0] rounded-[10px] p-3.5"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-extrabold uppercase text-[#C69214] block">
                    Selected Zone Inspector
                  </span>
                  <h4 className="text-sm font-black text-[#2E3440]">
                    Zone {activeZoneObj.zone} • Pos ({activeZoneObj.posX}, {activeZoneObj.posY})
                  </h4>
                  <p className="text-[11px] text-[#64748B] font-medium">{zoneMeta?.label}</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-[10px] text-[#64748B] font-sans font-bold block">{activeMetric}</span>
                  <strong className="text-xl text-[#001489]">
                    {activeZoneObj.metrics[activeMetric].toFixed(2)}
                  </strong>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-1.5 text-center font-mono text-[11px] pt-2 border-t border-[#E5E9F0]">
                {(['Impact', 'Energy', 'Grip', 'Boot', 'Reaction'] as IndexName[]).map((k) => (
                  <div key={k} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-1.5">
                    <span className="text-[9px] text-[#64748B] font-sans font-bold block">{k}</span>
                    <strong className="text-[#2E3440]">{activeZoneObj.metrics[k].toFixed(1)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 3: RADAR & WHAT-IF SIMULATOR */}
        {mobileTab === 'radar' && (
          <>
            <div
              className="bg-white border border-[#E2E8F0] rounded-[10px] p-4"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
            >
              <h3 className="text-sm font-extrabold text-[#2E3440] flex items-center gap-1.5 mb-1">
                <Target className="w-4 h-4 text-[#C69214]" />
                6-Axis Training Goal Suitability Radar
              </h3>
              <p className="text-[11px] text-[#64748B] font-medium mb-2">
                Navy: <strong className="text-[#001489]">{primaryEval.pitchName}</strong> • Purple:{' '}
                <strong className="text-purple-700">{refBaseline.pitchName}</strong>
              </p>

              <div className="flex justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2">
                <svg viewBox="0 0 280 280" className="w-full max-w-[250px] h-auto">
                  {[2, 4, 6, 8, 10].map((lvl) => (
                    <polygon
                      key={lvl}
                      points={TRAINING_GOAL_INDEXES.map((_, i) => {
                        const p = getRadarPt(i, lvl);
                        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#CBD5E1"
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
                          stroke="#CBD5E1"
                        />
                        <text
                          x={lp.x}
                          y={lp.y}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="fill-[#2E3440] text-[10px] font-extrabold"
                        >
                          {g}
                        </text>
                      </g>
                    );
                  })}
                  <polygon
                    points={makePoly(refBaseline.averages)}
                    fill="rgba(124,58,237,0.08)"
                    stroke="#7C3AED"
                    strokeWidth="1.75"
                    strokeDasharray="4 3"
                  />
                  <polygon
                    points={makePoly(primaryEval.averages)}
                    fill="rgba(0,20,137,0.18)"
                    stroke="#001489"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2.5">
                {TRAINING_GOAL_INDEXES.map((g) => (
                  <div
                    key={g}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2 text-center font-mono"
                  >
                    <span className="text-[10px] text-[#64748B] font-bold block font-sans">{g}</span>
                    <strong className="text-sm text-[#001489]">
                      {primaryEval.averages[g].toFixed(2)}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Touch Formula Simulator */}
            <div
              className="bg-white border border-[#E2E8F0] rounded-[10px] p-4 space-y-3"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-[#2E3440] flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-[#C69214]" />
                  Fieldside "What-If" Simulator
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    setSimImpact(primaryEval.averages.Impact);
                    setSimEnergy(primaryEval.averages.Energy);
                    setSimGrip(primaryEval.averages.Grip);
                  }}
                  className="text-[11px] font-bold text-[#2E3440] bg-[#F8F9FA] border border-[#CBD5E1] px-2 py-1 rounded-[6px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3 text-[#C69214]" /> Reset
                </button>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Impact</span>
                  <strong className="font-mono text-[#001489]">{simImpact.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="9.0"
                  step="0.05"
                  value={simImpact}
                  onChange={(e) => setSimImpact(parseFloat(e.target.value))}
                  className="w-full accent-[#001489]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Energy</span>
                  <strong className="font-mono text-emerald-700">{simEnergy.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="9.0"
                  step="0.05"
                  value={simEnergy}
                  onChange={(e) => setSimEnergy(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Grip</span>
                  <strong className="font-mono text-[#C69214]">{simGrip.toFixed(2)}</strong>
                </div>
                <input
                  type="range"
                  min="2.5"
                  max="9.5"
                  step="0.05"
                  value={simGrip}
                  onChange={(e) => setSimGrip(parseFloat(e.target.value))}
                  className="w-full accent-[#C69214]"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#E5E9F0] font-mono text-center">
                {TRAINING_GOAL_INDEXES.map((g) => (
                  <div key={g} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-1.5">
                    <span className="text-[9px] text-[#64748B] font-bold block font-sans">{g}</span>
                    <strong className="text-xs text-[#2E3440]">{simGoals[g].toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5 flex items-center justify-between text-xs">
                <span className="text-[#64748B] font-bold">Simulated Cleat:</span>
                <span className={`font-extrabold px-2 py-0.5 rounded border ${simBootRec.badgeBg}`}>
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
                className={`py-2 rounded-[8px] text-xs font-extrabold border ${
                  historyMode === 'sessions'
                    ? 'bg-[#001489] text-white border-[#C69214]'
                    : 'bg-white text-[#434C5E] border-[#CBD5E1]'
                }`}
              >
                23 Pitch Evaluations
              </button>
              <button
                type="button"
                onClick={() => setHistoryMode('emails')}
                className={`py-2 rounded-[8px] text-xs font-extrabold border ${
                  historyMode === 'emails'
                    ? 'bg-[#001489] text-white border-[#C69214]'
                    : 'bg-white text-[#434C5E] border-[#CBD5E1]'
                }`}
              >
                11 Superhuman Reports
              </button>
            </div>

            {historyMode === 'sessions' ? (
              <div className="space-y-2.5">
                {evaluations.map((ev) => {
                  const isAct = ev.id === primaryId;
                  const br = getBootRecommendation(
                    ev.averages.Boot,
                    ev.hardwareMetrics.studDepthMm,
                    ev.averages.Grip
                  );
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => {
                        onSelectPrimary(ev.id);
                        setMobileTab('briefing');
                      }}
                      className={`w-full text-left p-3.5 rounded-[10px] border transition-all ${
                        isAct
                          ? 'bg-[#EFF6FF] border-[1.5px] border-[#001489] border-l-[4px] border-l-[#C69214]'
                          : 'bg-white border-[#E2E8F0]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-[#001489] font-extrabold">
                          {ev.date} • {ev.sessionObjective}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${br.badgeBg}`}>
                          {br.code}
                        </span>
                      </div>
                      <div className="text-sm font-black text-[#2E3440]">{ev.pitchName}</div>
                      <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-[#E5E9F0] font-mono text-[11px]">
                        <div>
                          <span className="text-[9px] text-[#64748B] font-sans font-bold block">Impact</span>
                          <strong className="text-[#2E3440]">{ev.averages.Impact.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#64748B] font-sans font-bold block">Energy</span>
                          <strong className="text-emerald-700">{ev.averages.Energy.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#64748B] font-sans font-bold block">Grip</span>
                          <strong className="text-purple-700">{ev.averages.Grip.toFixed(1)}</strong>
                        </div>
                        <div>
                          <span className="text-[9px] text-[#64748B] font-sans font-bold block">Hardness</span>
                          <strong className="text-[#92400E]">{ev.hardwareMetrics.hardnessGm}g</strong>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2.5">
                {INGESTED_EMAIL_REPORTS.map((em) => (
                  <div
                    key={em.id}
                    className="bg-white border border-[#E2E8F0] rounded-[10px] p-3.5 space-y-2"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-[#001489] font-extrabold">{em.date}</span>
                      <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] font-sans font-bold">
                        {em.reportCategory}
                      </span>
                    </div>
                    <div className="text-xs font-black text-[#2E3440]">{em.subject}</div>
                    <div className="text-[11px] text-[#001489] bg-[#EFF6FF] border border-[#BFDBFE] rounded-[7px] p-2 font-bold">
                      {em.recommendedPitch}
                    </div>
                    <ul className="text-[11px] text-[#434C5E] font-medium list-disc list-inside space-y-1">
                      {em.keyTakeaways.map((k, idx) => (
                        <li key={idx}>{k}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB 5: APPENDIX A & RAW STADIA GUIDE */}
        {mobileTab === 'guide' && (
          <>
            <div
              className="bg-white border border-[#E2E8F0] rounded-[10px] p-3.5"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
            >
              <h3 className="text-sm font-extrabold text-[#2E3440] mb-1">
                Appendix A — Surface Definitions
              </h3>
              <p className="text-[11px] text-[#64748B] font-medium mb-3">
                Quick fieldside reference for RAA &amp; RTT physical metrics and FIFA benchmarks.
              </p>
              <div className="space-y-2.5">
                {APPENDIX_A_DEFINITIONS.map((def) => (
                  <div
                    key={def.term}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-[#2E3440] font-extrabold">{def.term}</strong>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Opt: {def.optimalBand}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[#C69214] mt-0.5">
                      {def.instrument}
                    </div>
                    <p className="text-[11px] text-[#434C5E] font-medium mt-1 leading-relaxed">
                      {def.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className="bg-white border border-[#E2E8F0] rounded-[10px] p-3.5"
              style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
            >
              <h3 className="text-sm font-extrabold text-[#2E3440] mb-2">
                Raw Stadia × US Soccer Index Guide
              </h3>
              <div className="space-y-2.5">
                {RAW_STADIA_KNOWLEDGE_SPECS.map((sp) => (
                  <div
                    key={sp.name}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-[#001489] font-extrabold">
                        {sp.name} ({sp.shortLabel})
                      </strong>
                      <span className="text-[10px] font-mono font-bold text-purple-700">
                        {sp.formulaDisplay}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#434C5E] font-medium mt-1">{sp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Thumb-Zone Navigation Bar (mnt-data-management white & gold bar) */}
      <nav
        className={`bg-white border-t border-[#E5E9F0] px-2 py-1.5 grid grid-cols-5 gap-1 shrink-0 ${
          isDesktopPreview ? '' : 'fixed bottom-0 left-0 right-0 z-40 shadow-lg'
        }`}
      >
        {[
          { id: 'briefing' as MobileTab, label: 'Fieldside', icon: Gauge },
          { id: 'pitch' as MobileTab, label: '18-Zone', icon: Compass },
          { id: 'radar' as MobileTab, label: 'Radar/Sim', icon: Target },
          { id: 'history' as MobileTab, label: 'Camp Log', icon: Calendar },
          { id: 'guide' as MobileTab, label: 'Appendix A', icon: BookOpen },
        ].map((item) => {
          const Icon = item.icon;
          const active = mobileTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMobileTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 rounded-[8px] transition-colors ${
                active
                  ? 'bg-[#EFF6FF] text-[#001489] border-t-2 border-t-[#C69214]'
                  : 'text-[#64748B] hover:text-[#2E3440]'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-[#C69214]' : 'text-[#64748B]'}`} />
              <span className="text-[10px] font-extrabold mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
