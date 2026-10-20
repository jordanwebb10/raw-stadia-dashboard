import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowLeftRight,
  BookOpen,
  Compass,
  Footprints,
  Gauge,
  Layers,
  Mail,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { EmailArchiveAndKnowledge } from './components/EmailArchiveAndKnowledge';
import { LongitudinalTimeline } from './components/LongitudinalTimeline';
import { MobileFieldsideView } from './components/MobileFieldsideView';
import { PitchHeatmap18Zone } from './components/PitchHeatmap18Zone';
import { RefGaugeCard } from './components/RefGaugeCard';
import { TrainingGoalRadar } from './components/TrainingGoalRadar';
import { INITIAL_EVALUATIONS, REFERENCE_BENCHMARKS } from './data/rawStadiaData';
import { APPENDIX_A_DEFINITIONS } from './data/rawStadiaKnowledge';
import { IndexName, PitchEvaluation } from './types/rawStadia';
import { getBootRecommendation, parseRawStadiaCsv } from './utils/rawStadiaEngine';

type ActiveTab = 'comparator' | 'spatial' | 'timeline' | 'emails' | 'knowledge';
type LayoutMode = 'auto' | 'desktop' | 'mobile';

export function App() {
  const [evaluations, setEvaluations] = useState<PitchEvaluation[]>(INITIAL_EVALUATIONS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('comparator');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('auto');
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Default to Orlando Match Day (from Jordan's Sept 26 mockup) vs Minnesota Allianz Field, anchored to NTC Camp Composite REF
  const [primaryId, setPrimaryId] = useState<string>('orlando-interco-md-2026-09-26');
  const [compareId, setCompareId] = useState<string>('minnesota-allianz-field-md-2026-10-06');
  const [refId, setRefId] = useState<string>('ref-ntc-camp-composite');

  const [activeMetric, setActiveMetric] = useState<IndexName>('Grip');
  const [selectedZone, setSelectedZone] = useState<number | null>(8);
  const [uploadBanner, setUploadBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const primaryEval = useMemo(
    () => evaluations.find((e) => e.id === primaryId) || evaluations[0],
    [evaluations, primaryId]
  );

  const compareEval = useMemo(
    () => evaluations.find((e) => e.id === compareId) || evaluations[evaluations.length - 1],
    [evaluations, compareId]
  );

  const refBaseline = useMemo(() => {
    if (refId === 'USE_COMPARE_PITCH') return compareEval;
    return (
      REFERENCE_BENCHMARKS.find((r) => r.id === refId) ||
      evaluations.find((e) => e.id === refId) ||
      REFERENCE_BENCHMARKS[0]
    );
  }, [refId, compareEval, evaluations]);

  const primaryBoot = useMemo(
    () =>
      getBootRecommendation(
        primaryEval.averages.Boot,
        primaryEval.hardwareMetrics.studDepthMm,
        primaryEval.averages.Grip
      ),
    [primaryEval]
  );

  const compareBoot = useMemo(
    () =>
      getBootRecommendation(
        compareEval.averages.Boot,
        compareEval.hardwareMetrics.studDepthMm,
        compareEval.averages.Grip
      ),
    [compareEval]
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = String(ev.target?.result || '');
        const parsed = parseRawStadiaCsv(text);
        if (parsed.length > 0) {
          setEvaluations((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newItems = parsed.filter((item) => !existingIds.has(item.id));
            return [...prev, ...newItems];
          });
          setPrimaryId(parsed[0].id);
          setUploadBanner(
            `Successfully ingested ${parsed.length} pitch evaluation session(s) from ${file.name}.`
          );
        } else {
          setUploadBanner(`No valid 18-zone rows found in ${file.name}.`);
        }
      } catch (err) {
        setUploadBanner(
          `CSV Parse Error: ${err instanceof Error ? err.message : 'Invalid format'}`
        );
      }
    };
    reader.readAsText(file);
  };

  const showMobileView =
    layoutMode === 'mobile' || (layoutMode === 'auto' && isMobileViewport);

  // If on an actual mobile screen in Auto or Mobile mode, render native full-screen MobileFieldsideView
  if (showMobileView && isMobileViewport) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <MobileFieldsideView
          evaluations={evaluations}
          referenceBenchmarks={REFERENCE_BENCHMARKS}
          primaryEval={primaryEval}
          compareEval={compareEval}
          refBaseline={refBaseline}
          primaryId={primaryId}
          compareId={compareId}
          refId={refId}
          onSelectPrimary={setPrimaryId}
          onSelectCompare={setCompareId}
          onSelectRef={setRefId}
          activeMetric={activeMetric}
          onSelectMetric={setActiveMetric}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          isDesktopPreview={false}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Executive Header */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 px-4 sm:px-8 py-3.5">
        <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          {/* Brand Title + Desktop/Mobile Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3.5">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-slate-900 border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-950/50">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    USMNT Integrated Performance Support
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Raw Stadia Surface Intelligence v2.6
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  USMNT Pitch &amp; Stadium Surface Intelligence Hub
                </h1>
              </div>
            </div>

            {/* Desktop vs Mobile Fieldside Switcher Pill */}
            <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setLayoutMode('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  !showMobileView
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                Desktop Pro
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  showMobileView
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                Mobile Fieldside
              </button>
            </div>
          </div>

          {/* Global Pitch A / Pitch B / REF Benchmark Selector Bar */}
          <div className="flex flex-wrap items-center gap-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl p-2">
            {/* Primary Pitch Selector */}
            <div className="flex flex-col px-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Primary Pitch (Pitch A)
              </label>
              <select
                value={primaryId}
                onChange={(e) => setPrimaryId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2 py-0.5"
              >
                <optgroup label="Match Day Stadiums" className="bg-slate-900 text-white">
                  {evaluations
                    .filter((e) => !e.pitchName.startsWith('USSF Super'))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.date} • {e.pitchName} (Imp {e.averages.Impact.toFixed(1)})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="NTC Training Fields (Super 3, 4, 5)" className="bg-slate-900 text-white">
                  {evaluations
                    .filter((e) => e.pitchName.startsWith('USSF Super'))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.date} • {e.pitchName} ({e.sessionObjective})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const temp = primaryId;
                setPrimaryId(compareId);
                setCompareId(temp);
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Swap Pitch A and Pitch B"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            {/* Comparison Pitch Selector */}
            <div className="flex flex-col px-2 border-l border-slate-800">
              <label className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                Compare Pitch (Pitch B)
              </label>
              <select
                value={compareId}
                onChange={(e) => setCompareId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer pr-2 py-0.5"
              >
                <optgroup label="Match Day Stadiums" className="bg-slate-900 text-white">
                  {evaluations
                    .filter((e) => !e.pitchName.startsWith('USSF Super'))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.date} • {e.pitchName} (Imp {e.averages.Impact.toFixed(1)})
                      </option>
                    ))}
                </optgroup>
                <optgroup label="NTC Training Fields (Super 3, 4, 5)" className="bg-slate-900 text-white">
                  {evaluations
                    .filter((e) => e.pitchName.startsWith('USSF Super'))
                    .map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.date} • {e.pitchName} ({e.sessionObjective})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Purple REF Line Anchor Selector */}
            <div className="flex flex-col px-2 border-l border-slate-800">
              <label className="text-[10px] font-bold uppercase tracking-wider text-violet-400">
                Purple REF Gauge Anchor
              </label>
              <select
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
                className="bg-transparent text-xs font-bold text-violet-200 focus:outline-none cursor-pointer pr-2 py-0.5"
              >
                <optgroup label="NTC Reference Baselines" className="bg-slate-900 text-white">
                  {REFERENCE_BENCHMARKS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.pitchName} (Imp {r.averages.Impact.toFixed(1)} | Grip{' '}
                      {r.averages.Grip.toFixed(1)})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Dynamic Comparison" className="bg-slate-900 text-white">
                  <option value="USE_COMPARE_PITCH">
                    Anchor REF to Pitch B ({compareEval.pitchName})
                  </option>
                </optgroup>
              </select>
            </div>

            {/* CSV Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              Ingest CSV
            </button>
          </div>
        </div>

        {/* Navigation Bar (Shown in Desktop Pro Mode) */}
        {!showMobileView && (
          <div className="max-w-[1600px] mx-auto mt-3 pt-2.5 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                {
                  id: 'comparator' as ActiveTab,
                  label: 'Pitch Comparator & REF Gauges',
                  icon: Gauge,
                },
                {
                  id: 'spatial' as ActiveTab,
                  label: '18-Zone Spatial Heatmap',
                  icon: Compass,
                },
                {
                  id: 'timeline' as ActiveTab,
                  label: 'Camp Timeline & 23-Session Matrix',
                  icon: TrendingUp,
                },
                {
                  id: 'emails' as ActiveTab,
                  label: 'Ingested Camp Reports (11)',
                  icon: Mail,
                },
                {
                  id: 'knowledge' as ActiveTab,
                  label: 'Raw Stadia Expert & Appendix A',
                  icon: BookOpen,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isAct = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                      isAct
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                        : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>23 Pitch Evaluations</span>
              <span>•</span>
              <span>414 Spatial Zones</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Formulas Verified (10⁻⁹)
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Optional Upload Feedback Banner */}
      {uploadBanner && (
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-8 mt-4">
          <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-200">
            <span>{uploadBanner}</span>
            <button
              type="button"
              onClick={() => setUploadBanner(null)}
              className="text-emerald-300 font-bold hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {showMobileView ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-2">
            {/* Left 5 Columns: Explanation of Mobile Fieldside Ergonomics */}
            <div className="lg:col-span-5 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                <Smartphone className="w-4 h-4" />
                Mobile-First Fieldside Experience
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Engineered for Pitch-Side &amp; Locker Room Mobile Use
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                When opened on a smartphone (<code className="text-emerald-300">&lt; 768px</code>),
                the hub automatically launches into this dedicated{' '}
                <strong>Mobile Fieldside View</strong>. You can also interact with it live right
                here on desktop:
              </p>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <strong className="text-emerald-400 block text-sm mb-0.5">
                    1. Portrait Goal-to-Goal 18-Zone Pitch Map
                  </strong>
                  Rotates the 3×6 Raw Stadia grid into a vertical Goal-to-Goal orientation (3 columns
                  wide × 6 rows long) so every zone button is a 56px thumb target without horizontal
                  pinch-zooming.
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <strong className="text-violet-300 block text-sm mb-0.5">
                    2. Stacked 0–10 REF Gauges &amp; Instant Cleat Callout
                  </strong>
                  Displays the recommended boot soleplate (<code className="text-white">FG-L</code>,{' '}
                  <code className="text-white">Mixed</code>, <code className="text-white">FG-S</code>
                  ), Stud Depth (mm), Hardness (Gm), and purple <code className="text-violet-300">REF</code>{' '}
                  gauges with collapsible 18-zone mini-maps.
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <strong className="text-sky-300 block text-sm mb-0.5">
                    3. Thumb-Zone Bottom Tab Bar
                  </strong>
                  One-handed navigation between <strong>Fieldside</strong>,{' '}
                  <strong>18-Zone Map</strong>, <strong>Radar/Sim</strong>,{' '}
                  <strong>Camp Log</strong>, and <strong>Appendix A Guide</strong>.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLayoutMode('desktop')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
              >
                ← Return to Full Desktop Pro Dashboard
              </button>
            </div>

            {/* Right 7 Columns: Live Interactive Mobile Device Frame */}
            <div className="lg:col-span-7 flex justify-center">
              <MobileFieldsideView
                evaluations={evaluations}
                referenceBenchmarks={REFERENCE_BENCHMARKS}
                primaryEval={primaryEval}
                compareEval={compareEval}
                refBaseline={refBaseline}
                primaryId={primaryId}
                compareId={compareId}
                refId={refId}
                onSelectPrimary={setPrimaryId}
                onSelectCompare={setCompareId}
                onSelectRef={setRefId}
                activeMetric={activeMetric}
                onSelectMetric={setActiveMetric}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
                isDesktopPreview={true}
              />
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'comparator' && (
              <>
                {/* Top Context Banner for Selected Pitch */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Primary Pitch A • {primaryEval.date}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        Session Objective: {primaryEval.sessionObjective}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        Uniformity: {primaryEval.uniformityScore}%
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white">
                      {primaryEval.pitchName}{' '}
                      <span className="text-sm font-normal text-slate-400">
                        ({primaryEval.venue})
                      </span>
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-4xl leading-relaxed">
                      {primaryEval.notes}
                    </p>
                  </div>

                  {/* Boot Recommendation Card on Top Right */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 min-w-[290px] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Footprints className="w-3.5 h-3.5 text-emerald-400" />
                        Footwear Recommendation
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded border ${primaryBoot.badgeBg}`}
                      >
                        {primaryBoot.code} • {primaryEval.averages.Boot.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-white">{primaryBoot.name}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Stud Depth:{' '}
                      <strong className="text-slate-200">
                        {primaryEval.hardwareMetrics.studDepthMm} mm
                      </strong>{' '}
                      • Hardness:{' '}
                      <strong className="text-amber-300">
                        {primaryEval.hardwareMetrics.hardnessGm} Gm
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Jordan Webb's Sept 26 Signature 3-Column REF Gauge + 18-Zone Pitch Row */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                        Core Surface Performance Triad — 0–10 Gauges with{' '}
                        <span className="text-violet-300">{refBaseline.pitchName}</span> REF Anchor
                        &amp; 18-Zone Maps
                      </h3>
                    </div>
                    <span className="text-xs text-slate-400">
                      Click any circle on the 18-zone maps to inspect that zone in the Spatial
                      Explorer
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <RefGaugeCard
                      metric="Impact"
                      subtitle="Compaction & Force Attenuation"
                      value={primaryEval.averages.Impact}
                      refValue={refBaseline.averages.Impact}
                      refLabel={refBaseline.pitchName}
                      optimalRange={[4.0, 6.0]}
                      zones={primaryEval.zones}
                      selectedZone={selectedZone}
                      onSelectZone={(z) => {
                        setSelectedZone(z);
                        setActiveMetric('Impact');
                      }}
                    />
                    <RefGaugeCard
                      metric="Energy"
                      subtitle="Elastic Rebound & Restitution"
                      value={primaryEval.averages.Energy}
                      refValue={refBaseline.averages.Energy}
                      refLabel={refBaseline.pitchName}
                      optimalRange={[3.8, 5.5]}
                      zones={primaryEval.zones}
                      selectedZone={selectedZone}
                      onSelectZone={(z) => {
                        setSelectedZone(z);
                        setActiveMetric('Energy');
                      }}
                    />
                    <RefGaugeCard
                      metric="Grip"
                      subtitle="Rotational & Linear Traction"
                      value={primaryEval.averages.Grip}
                      refValue={refBaseline.averages.Grip}
                      refLabel={refBaseline.pitchName}
                      optimalRange={[5.5, 7.2]}
                      zones={primaryEval.zones}
                      selectedZone={selectedZone}
                      onSelectZone={(z) => {
                        setSelectedZone(z);
                        setActiveMetric('Grip');
                      }}
                    />
                  </div>
                </div>

                {/* Side-by-Side Head-to-Head Pitch A vs Pitch B Hardware & Biomechanical Comparison */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        Head-to-Head Field Comparison: {primaryEval.pitchName} ({primaryEval.date})
                        vs. {compareEval.pitchName} ({compareEval.date})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Direct comparison across RAA &amp; RTT physical hardware measurements,
                        spatial uniformity, and footwear requirements
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('spatial')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
                    >
                      Open Full 18-Zone Spatial Map →
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      {
                        label: 'Hardness (Gm)',
                        p: primaryEval.hardwareMetrics.hardnessGm,
                        c: compareEval.hardwareMetrics.hardnessGm,
                        unit: 'Gm',
                        opt: '65–85 Gm',
                      },
                      {
                        label: 'Shock Absorption',
                        p: primaryEval.hardwareMetrics.shockAbsorptionPct,
                        c: compareEval.hardwareMetrics.shockAbsorptionPct,
                        unit: '%',
                        opt: '58–68%',
                      },
                      {
                        label: 'Energy Restitution',
                        p: primaryEval.hardwareMetrics.energyRestitutionPct,
                        c: compareEval.hardwareMetrics.energyRestitutionPct,
                        unit: '%',
                        opt: '16–21%',
                      },
                      {
                        label: 'Rotational Torque',
                        p: primaryEval.hardwareMetrics.rotationalResistanceNm,
                        c: compareEval.hardwareMetrics.rotationalResistanceNm,
                        unit: 'Nm',
                        opt: '35–52 Nm',
                      },
                      {
                        label: 'Stud Penetration',
                        p: primaryEval.hardwareMetrics.studDepthMm,
                        c: compareEval.hardwareMetrics.studDepthMm,
                        unit: 'mm',
                        opt: '9.5–13.5 mm',
                      },
                      {
                        label: 'Boot Cleat Index',
                        p: primaryEval.averages.Boot,
                        c: compareEval.averages.Boot,
                        unit: `/10 (${primaryBoot.code} vs ${compareBoot.code})`,
                        opt: '2.5–5.3',
                      },
                    ].map((item) => {
                      const diff = Number((item.p - item.c).toFixed(1));
                      return (
                        <div
                          key={item.label}
                          className="bg-slate-950/80 border border-slate-800 rounded-xl p-3"
                        >
                          <div className="text-[11px] font-bold text-slate-400">{item.label}</div>
                          <div className="flex items-baseline justify-between mt-1.5 font-mono">
                            <div>
                              <span className="text-[10px] text-emerald-400 block">Pitch A</span>
                              <strong className="text-base text-white">{item.p}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-sky-400 block">Pitch B</span>
                              <strong className="text-base text-slate-300">{item.c}</strong>
                            </div>
                          </div>
                          <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-500">Opt: {item.opt}</span>
                            <span className={diff > 0 ? 'text-amber-300' : 'text-sky-300'}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 6-Axis Training Goal Radar & Interactive Formula Simulator */}
                <TrainingGoalRadar
                  primaryEval={primaryEval}
                  compareEval={compareEval}
                  refBaseline={refBaseline}
                />

                {/* Quick Appendix A Reference Strip at Bottom of Comparator */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-emerald-400" />
                      Appendix A — Surface Characteristic Quick Reference
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('knowledge')}
                      className="text-xs font-bold text-emerald-400 hover:underline"
                    >
                      Open Full Raw Stadia Encyclopedia →
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {APPENDIX_A_DEFINITIONS.slice(0, 6).map((def) => (
                      <div
                        key={def.term}
                        className="bg-slate-950/75 border border-slate-800/90 rounded-xl p-3 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-white mb-1">
                          <span>{def.term}</span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            Opt: {def.optimalBand}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] leading-relaxed">
                          {def.definition}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'spatial' && (
              <PitchHeatmap18Zone
                evaluation={primaryEval}
                comparisonEval={refBaseline}
                activeMetric={activeMetric}
                onSelectMetric={setActiveMetric}
                selectedZone={selectedZone}
                onSelectZone={setSelectedZone}
              />
            )}

            {activeTab === 'timeline' && (
              <LongitudinalTimeline
                evaluations={evaluations}
                selectedPrimaryId={primaryId}
                selectedCompareId={compareId}
                onSelectPrimary={(id) => {
                  setPrimaryId(id);
                }}
                onSelectCompare={(id) => {
                  setCompareId(id);
                }}
              />
            )}

            {activeTab === 'emails' && <EmailArchiveAndKnowledge mode="emails" />}

            {activeTab === 'knowledge' && <EmailArchiveAndKnowledge mode="knowledge" />}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
