import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Compass,
  Gauge,
  Layers,
  Shield,
  ShieldAlert,
} from 'lucide-react';
import {
  APPENDIX_A_DEFINITIONS,
  RAW_STADIA_INDEX_SPECS,
} from '../data/rawStadiaKnowledge';
import { IndexName, PitchEvaluation, ReferenceBaselineProfile } from '../types/rawStadia';
import {
  CORE_INDEX_NAMES,
  getZoneStatusColor,
  REFERENCE_MODE_OPTIONS,
  SNAKE_ZONE_COORDS,
} from '../utils/rawStadiaEngine';

interface MobileFieldsideViewProps {
  evaluations: PitchEvaluation[];
  primaryEval: PitchEvaluation;
  compareEval: PitchEvaluation;
  referenceProfile: ReferenceBaselineProfile;
  primaryId: string;
  compareId: string;
  refModeId: string;
  onSelectPrimary: (id: string) => void;
  onSelectCompare: (id: string) => void;
  onSelectRefMode: (id: string) => void;
  activeMetric: IndexName;
  onSelectMetric: (m: IndexName) => void;
  selectedZone: number | null;
  onSelectZone: (z: number) => void;
  isDesktopPreview?: boolean;
}

type MobileTab = 'briefing' | 'pitch' | 'guide';

export const MobileFieldsideView: React.FC<MobileFieldsideViewProps> = ({
  evaluations,
  primaryEval,
  compareEval,
  referenceProfile,
  primaryId,
  compareId,
  refModeId,
  onSelectPrimary,
  onSelectCompare,
  onSelectRefMode,
  activeMetric,
  onSelectMetric,
  selectedZone,
  onSelectZone,
  isDesktopPreview = false,
}) => {
  const [mobileTab, setMobileTab] = useState<MobileTab>('briefing');
  const [expandedMiniMap, setExpandedMiniMap] = useState<IndexName | null>('Impact');
  const [showSnake, setShowSnake] = useState<boolean>(false);
  const [deltaMode, setDeltaMode] = useState<'single' | 'vs-b' | 'vs-ref'>('single');

  // Portrait 18-Zone Grid for Mobile:
  // 6 rows from Top Goal (Pos Y = 1) to Bottom Goal (Pos Y = 6)
  // 3 columns across pitch width (Pos X = 3 Left/North, Pos X = 2 Spine, Pos X = 1 Right/South)
  const portraitRows = [1, 2, 3, 4, 5, 6].map((posY) =>
    [3, 2, 1].map((posX) => primaryEval.zones.find((z) => z.posX === posX && z.posY === posY)!)
  );

  const activeZoneObj =
    primaryEval.zones.find((z) => z.zone === (selectedZone ?? 8)) || primaryEval.zones[7];
  const zoneMeta = SNAKE_ZONE_COORDS.find((c) => c.zone === activeZoneObj.zone);

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

      {/* Mobile Sticky Pitch & REF Selector Header */}
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

        {/* Compact 2-Column Dropdowns for Pitch A and Reference Baseline */}
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
              2. Reference Range (REF)
            </label>
            <select
              value={refModeId}
              onChange={(e) => onSelectRefMode(e.target.value)}
              className="w-full bg-transparent text-[11px] font-bold text-purple-900 focus:outline-none truncate"
            >
              {REFERENCE_MODE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-white text-[#1E293B]">
                  {opt.shortLabel}
                </option>
              ))}
              {evaluations.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-white text-[#1E293B]">
                  Pitch: {ev.pitchName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Mobile Content Area */}
      <div className="flex-1 overflow-y-auto px-3.5 py-3.5 space-y-3.5">
        {/* TAB 1: FIELDSIDE BRIEFING & 3 CORE REF GAUGES */}
        {mobileTab === 'briefing' && (
          <>
            {/* Top Fieldside Summary Card */}
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

              <p className="text-[11px] text-[#434C5E] font-medium leading-relaxed mt-1">
                {primaryEval.notes}
              </p>

              {/* 3 Core Playing Surface Index Pill Readouts */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#E5E9F0] text-center font-mono">
                {CORE_INDEX_NAMES.map((m) => (
                  <div
                    key={m}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-2"
                  >
                    <span className="text-[9px] text-[#64748B] font-sans font-extrabold uppercase block">
                      {m} (Mean ± SD)
                    </span>
                    <strong className="text-xs text-[#001489]">
                      {primaryEval.averages[m].toFixed(2)} ± {primaryEval.stdDevs[m].toFixed(2)}
                    </strong>
                    <span className="text-[9px] text-purple-700 block">
                      REF: {referenceProfile.metrics[m].mean.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Stacked 0-10 REF Gauges with Expandable 18-Zone Mini Maps */}
            {CORE_INDEX_NAMES.map((m) => {
              const spec = RAW_STADIA_INDEX_SPECS.find((s) => s.index === m)!;
              const refStats = referenceProfile.metrics[m];
              const val = primaryEval.averages[m];
              const bVal = compareEval.averages[m];
              const rVal = refStats.mean;
              const deltaVsRef = Number((val - rVal).toFixed(2));
              const deltaVsB = Number((val - bVal).toFixed(2));
              const pctVal = Math.max(0, Math.min(100, (val / 10) * 100));
              const pctB = Math.max(0, Math.min(100, (bVal / 10) * 100));
              const pctRef = Math.max(0, Math.min(100, (rVal / 10) * 100));
              const optLeft = (refStats.bandLow / 10) * 100;
              const optW = ((refStats.bandHigh - refStats.bandLow) / 10) * 100;
              const badge = getZoneStatusColor(m, val, refStats);
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
                        {spec.mechanicalProperty}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-[#2E3440] font-mono">
                          {val.toFixed(2)}
                        </span>
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
                      <div className="text-[10px] font-mono font-bold text-[#C69214] mt-1">
                        {deltaVsB >= 0 ? `+${deltaVsB}` : deltaVsB} vs B ({bVal.toFixed(2)})
                      </div>
                      <div className="text-[10px] font-mono font-bold text-purple-700">
                        {deltaVsRef >= 0 ? `+${deltaVsRef}` : deltaVsRef} vs REF ({rVal.toFixed(2)})
                      </div>
                    </div>
                  </div>

                  {/* 0-10 Gauge Bar with Pitch A, Pitch B, and Purple REF Line */}
                  <div className="mt-3 mb-4">
                    <div className="relative h-4 rounded bg-[#F1F5F9] border border-[#CBD5E1] flex items-center">
                      <div
                        className="absolute h-full bg-emerald-500/25 border-x border-emerald-500/60"
                        style={{ left: `${optLeft}%`, width: `${optW}%` }}
                      />
                      <div
                        className="relative h-2 bg-[#001489] border border-[#1E3A8A] rounded-r-sm z-10"
                        style={{ width: `${pctVal}%` }}
                      />
                      {/* Pitch B Marker */}
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-[#C69214] z-15"
                        style={{ left: `${pctB}%` }}
                      />
                      {/* Purple REF Line */}
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

                  {/* PDF Spectrum Footer */}
                  <div className="grid grid-cols-2 gap-1.5 mb-2 text-[9.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2">
                    <div>
                      <div className="font-black text-[#2E3440]">← {spec.leftSpectrum.title}</div>
                      <div className="text-[#001489] font-semibold">
                        Watch: {spec.leftSpectrum.suggestedInjuryWatch}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-[#2E3440]">{spec.rightSpectrum.title} →</div>
                      <div className="text-[#DA291C] font-semibold">
                        Watch: {spec.rightSpectrum.suggestedInjuryWatch}
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
                            const zc = getZoneStatusColor(m, zv, refStats);
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
                  {primaryEval.hotspots.length} Localized Zone Outlier(s) Flagged
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
            {/* 3 Core Playing Surface Indexes Layer Pills */}
            <div className="grid grid-cols-3 gap-2">
              {CORE_INDEX_NAMES.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMetric(m)}
                  className={`py-1.5 px-2 rounded-[6px] text-xs border text-center ${
                    activeMetric === m
                      ? 'bg-[#001489] text-white border-[#C69214] font-extrabold'
                      : 'bg-white text-[#434C5E] border-[#CBD5E1] font-bold'
                  }`}
                >
                  {m} ({primaryEval.averages[m].toFixed(2)})
                </button>
              ))}
            </div>

            {/* Controls bar */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setShowSnake(!showSnake)}
                className={`py-1.5 px-2.5 rounded-[7px] text-[11px] font-bold border flex items-center justify-center gap-1 ${
                  showSnake
                    ? 'bg-[#EFF6FF] border-[#001489] text-[#001489]'
                    : 'bg-white border-[#CBD5E1] text-[#2E3440]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#C69214]" />
                {showSnake ? 'Hide Walk' : 'Walk (1→18)'}
              </button>

              <div className="inline-flex rounded-[7px] bg-white border border-[#CBD5E1] p-0.5 text-[10px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setDeltaMode('single')}
                  className={`px-2 py-1 rounded ${
                    deltaMode === 'single' ? 'bg-[#001489] text-white' : 'text-[#434C5E]'
                  }`}
                >
                  Pitch A
                </button>
                <button
                  type="button"
                  onClick={() => setDeltaMode('vs-b')}
                  className={`px-2 py-1 rounded ${
                    deltaMode === 'vs-b' ? 'bg-[#C69214] text-white' : 'text-[#434C5E]'
                  }`}
                >
                  Δ vs B
                </button>
                <button
                  type="button"
                  onClick={() => setDeltaMode('vs-ref')}
                  className={`px-2 py-1 rounded ${
                    deltaMode === 'vs-ref' ? 'bg-purple-700 text-white' : 'text-[#434C5E]'
                  }`}
                >
                  Δ vs REF
                </button>
              </div>
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
                        const bVal =
                          compareEval.zones.find((bz) => bz.zone === z.zone)?.metrics[
                            activeMetric
                          ] ?? val;
                        const rVal = referenceProfile.metrics[activeMetric].mean;
                        const diffB = Number((val - bVal).toFixed(1));
                        const diffRef = Number((val - rVal).toFixed(1));
                        const cs = getZoneStatusColor(
                          activeMetric,
                          val,
                          referenceProfile.metrics[activeMetric]
                        );
                        const isSel = activeZoneObj.zone === z.zone;

                        let disp = val.toFixed(1);
                        if (deltaMode === 'vs-b') {
                          disp = diffB > 0 ? `+${diffB}` : `${diffB}`;
                        } else if (deltaMode === 'vs-ref') {
                          disp = diffRef > 0 ? `+${diffRef}` : `${diffRef}`;
                        }

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
                            <span className="text-sm font-black leading-tight">{disp}</span>
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
                  <span className="text-[10px] text-[#64748B] font-sans font-bold block">
                    {activeMetric}
                  </span>
                  <strong className="text-xl text-[#001489]">
                    {activeZoneObj.metrics[activeMetric].toFixed(2)}
                  </strong>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] pt-2 border-t border-[#E5E9F0]">
                {CORE_INDEX_NAMES.map((k) => (
                  <div key={k} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-1.5">
                    <span className="text-[9px] text-[#64748B] font-sans font-bold block">{k}</span>
                    <strong className="text-[#2E3440]">{activeZoneObj.metrics[k].toFixed(2)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* TAB 3: RAW STADIA 3-PAGE PDF GUIDE & REFERENCE METHODOLOGY */}
        {mobileTab === 'guide' && (
          <div className="space-y-3">
            {/* Reference Range Methodology Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-[10px] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
                  Reference Range Methodology
                </span>
                <span className="text-[10px] font-mono font-bold text-[#64748B]">
                  {referenceProfile.shortLabel}
                </span>
              </div>
              <p className="text-[11px] text-[#434C5E] leading-relaxed">
                {referenceProfile.description}
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
                {CORE_INDEX_NAMES.map((m) => {
                  const st = referenceProfile.metrics[m];
                  return (
                    <div
                      key={m}
                      className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-1.5"
                    >
                      <div className="font-sans font-extrabold text-[#001489]">{m}</div>
                      <div className="font-black text-[#2E3440]">
                        {st.mean.toFixed(2)} ± {st.sd.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-emerald-700 font-bold">
                        [{st.bandLow.toFixed(2)}–{st.bandHigh.toFixed(2)}]
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3 Core Playing Surface Indexes Cards */}
            {RAW_STADIA_INDEX_SPECS.map((spec) => (
              <div
                key={spec.index}
                className="bg-white border border-[#E2E8F0] rounded-[10px] p-3.5 space-y-2"
                style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#001489]">{spec.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#001489] border border-[#BFDBFE]">
                    {spec.mechanicalProperty}
                  </span>
                </div>
                <p className="text-[11px] text-[#434C5E] leading-relaxed">{spec.whatIsIt}</p>
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2">
                    <div className="font-black text-[#2E3440]">← {spec.leftSpectrum.title}</div>
                    <div className="text-[#434C5E] mt-0.5">
                      Effect: <strong>{spec.leftSpectrum.effectOnPlayer}</strong>
                    </div>
                    <div className="text-[#001489] font-semibold mt-0.5 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-[#C69214]" />
                      Watch: {spec.leftSpectrum.suggestedInjuryWatch}
                    </div>
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded p-2 text-right">
                    <div className="font-black text-[#2E3440]">{spec.rightSpectrum.title} →</div>
                    <div className="text-[#434C5E] mt-0.5">
                      Effect: <strong>{spec.rightSpectrum.effectOnPlayer}</strong>
                    </div>
                    <div className="text-[#DA291C] font-semibold mt-0.5">
                      Watch: {spec.rightSpectrum.suggestedInjuryWatch}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Appendix A Definitions */}
            {APPENDIX_A_DEFINITIONS.map((a) => (
              <div
                key={a.term}
                className="bg-white border border-[#E2E8F0] rounded-[10px] p-3.5"
              >
                <div className="text-xs font-black text-[#2E3440]">{a.term}</div>
                <p className="text-[11px] text-[#434C5E] mt-1 leading-relaxed">{a.definition}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <div
        className={`bg-white border-t border-[#E5E9F0] grid grid-cols-3 py-1.5 px-1 shrink-0 ${
          isDesktopPreview
            ? ''
            : 'fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]'
        }`}
      >
        {[
          { id: 'briefing' as MobileTab, label: '3-Index Briefing', icon: Gauge },
          { id: 'pitch' as MobileTab, label: '18-Zone Map', icon: Compass },
          { id: 'guide' as MobileTab, label: 'PDF Guide', icon: BookOpen },
        ].map((item) => {
          const Icon = item.icon;
          const isAct = mobileTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMobileTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-[8px] transition-colors ${
                isAct ? 'text-[#001489] bg-[#EFF6FF]' : 'text-[#64748B] hover:text-[#2E3440]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isAct ? 'text-[#001489]' : 'text-[#64748B]'}`} />
              <span className="text-[10px] font-extrabold mt-0.5 tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
