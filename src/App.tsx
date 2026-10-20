import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Layers,
  LucideIcon,
  Monitor,
  Scale,
  Shield,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Upload,
} from 'lucide-react';
import { AppendixAModal } from './components/AppendixAModal';
import { HeadToHeadVisualComparison } from './components/HeadToHeadVisualComparison';
import { LongitudinalTimeline } from './components/LongitudinalTimeline';
import { MobileFieldsideView } from './components/MobileFieldsideView';
import { PitchHeatmap18Zone } from './components/PitchHeatmap18Zone';
import { RefGaugeCard, TriadMiniMapMode } from './components/RefGaugeCard';
import { INITIAL_EVALUATIONS } from './data/rawStadiaData';
import { IndexName, PitchEvaluation } from './types/rawStadia';
import {
  buildReferenceBaselineProfile,
  getPitchSpreadSummary,
  parseRawStadiaCsv,
  REFERENCE_MODE_OPTIONS,
} from './utils/rawStadiaEngine';

type ActiveTab = 'comparator' | 'timeline';
type LayoutMode = 'auto' | 'desktop' | 'mobile';

const MODULE_META: Record<
  ActiveTab,
  {
    label: string;
    subtitle: string;
    topTitle: string;
    topSubtitle: string;
    badge: string;
    icon: LucideIcon;
  }
> = {
  comparator: {
    label: '1. Pitch Comparator',
    subtitle: 'Impact • Energy • Grip + 18-Zone Map',
    topTitle: 'Pitch Comparator & 18-Zone Spatial Intelligence',
    topSubtitle:
      'Compare Primary Pitch (A), Compare Pitch (B), and Empirical Reference Range (Mean ± 1 SD) across Impact, Energy, and Grip',
    badge: 'Core',
    icon: Gauge,
  },
  timeline: {
    label: '2. Camp Session Progression',
    subtitle: 'Chronological Mean ± 1 SD',
    topTitle: 'Camp Session Progression & Spectrum Load Inspector',
    topSubtitle:
      'Field-independent chronological exposure (Mean ± 1 SD vs. Reference Band) across Impact, Energy, and Grip',
    badge: 'Timeline',
    icon: TrendingUp,
  },
};

export function App() {
  const [evaluations, setEvaluations] = useState<PitchEvaluation[]>(INITIAL_EVALUATIONS);
  const [activeTab, setActiveTab] = useState<ActiveTab>('comparator');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('auto');
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [venueCategoryFilter, setVenueCategoryFilter] = useState<'ALL' | 'STADIUM' | 'NTC'>('ALL');
  const [triadMapMode, setTriadMapMode] = useState<TriadMiniMapMode>('stackAB');

  // Metric Reference Guide Popup Modal State
  const [appendixAOpen, setAppendixAOpen] = useState<boolean>(false);
  const [appendixAHighlight, setAppendixAHighlight] = useState<string | null>(null);

  const openAppendixA = (metricKey?: string) => {
    setAppendixAHighlight(metricKey || null);
    setAppendixAOpen(true);
  };

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Default to Orlando Match Day (Sept 26) vs Minnesota Allianz Field (Oct 6), anchored to Jose's Report Hard Reference Ranges
  const [primaryId, setPrimaryId] = useState<string>('orlando-interco-md-2026-09-26');
  const [compareId, setCompareId] = useState<string>('minnesota-allianz-field-md-2026-10-06');
  const [refModeId, setRefModeId] = useState<string>('raw-stadia-scale');

  const [activeMetric, setActiveMetric] = useState<IndexName>('Impact');
  const [selectedZone, setSelectedZone] = useState<number | null>(8);
  const [uploadBanner, setUploadBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredSidebarEvals = useMemo(() => {
    if (venueCategoryFilter === 'STADIUM') {
      return evaluations.filter((e) => !e.pitchName.startsWith('USSF Super'));
    }
    if (venueCategoryFilter === 'NTC') {
      return evaluations.filter((e) => e.pitchName.startsWith('USSF Super'));
    }
    return evaluations;
  }, [evaluations, venueCategoryFilter]);

  const primaryEval = useMemo(
    () => evaluations.find((e) => e.id === primaryId) || evaluations[0],
    [evaluations, primaryId]
  );

  const compareEval = useMemo(
    () => evaluations.find((e) => e.id === compareId) || evaluations[evaluations.length - 1],
    [evaluations, compareId]
  );

  // Build Empirical Reference Baseline Profile (Mean +/- 1 SD)
  const referenceProfile = useMemo(
    () => buildReferenceBaselineProfile(refModeId, evaluations),
    [refModeId, evaluations]
  );

  const primarySpread = useMemo(() => getPitchSpreadSummary(primaryEval), [primaryEval]);

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
      <div className="min-h-screen bg-[#F8FAFC] text-[#2E3440]">
        <MobileFieldsideView
          evaluations={evaluations}
          primaryEval={primaryEval}
          compareEval={compareEval}
          referenceProfile={referenceProfile}
          primaryId={primaryId}
          compareId={compareId}
          refModeId={refModeId}
          onSelectPrimary={setPrimaryId}
          onSelectCompare={setCompareId}
          onSelectRefMode={setRefModeId}
          activeMetric={activeMetric}
          onSelectMetric={setActiveMetric}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          isDesktopPreview={false}
        />
      </div>
    );
  }

  const currentModule = MODULE_META[activeTab];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* ===================================================================
          LEFT SIDEBAR NAVIGATION (Exact mnt-data-management SidebarNav.tsx)
          =================================================================== */}
      <aside
        style={{
          width: isSidebarCollapsed ? '72px' : '270px',
          background: '#F8F9FA',
          borderRight: '1px solid #E5E9F0',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          flexShrink: 0,
          zIndex: 40,
          boxShadow: '2px 0 12px rgba(0, 0, 0, 0.04)',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* 1. Brand Header */}
        <div
          style={{
            padding: isSidebarCollapsed ? '18px 12px' : '18px 16px',
            borderBottom: '1px solid #E5E9F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
            gap: '12px',
            background: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
            {/* USSF Crest Badge */}
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #001489 0%, #1E3A8A 100%)',
                border: '1.5px solid #C69214',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0, 20, 137, 0.2)',
              }}
            >
              <Shield size={19} color="#FFFFFF" />
            </div>
            {!isSidebarCollapsed && (
              <div style={{ overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: '0.94rem',
                    fontWeight: 900,
                    color: '#2E3440',
                    letterSpacing: '-0.02em',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.15,
                  }}
                >
                  MNT Surface Hub
                </div>
                <div
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    color: '#C69214',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                  }}
                >
                  Impact • Energy • Grip
                </div>
              </div>
            )}
          </div>

          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              title="Collapse Sidebar"
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#64748B',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* 2. Global Session / Pitch Context Selector (Hidden when collapsed) */}
        {!isSidebarCollapsed && (
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid #E5E9F0',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={12} color="#C69214" />
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  color: '#434C5E',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Session Context
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Venue Filter Dropdown */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: '#64748B',
                    marginBottom: '2px',
                  }}
                >
                  1. VENUE FILTER
                </label>
                <select
                  value={venueCategoryFilter}
                  onChange={(e) =>
                    setVenueCategoryFilter(e.target.value as 'ALL' | 'STADIUM' | 'NTC')
                  }
                  style={{
                    width: '100%',
                    background: '#F8F9FA',
                    border: '1px solid #CBD5E1',
                    color: '#1E293B',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '5px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <option value="ALL">All Camp Evaluations ({evaluations.length})</option>
                  <option value="STADIUM">Match Day Stadiums (5)</option>
                  <option value="NTC">NTC Training Fields (18)</option>
                </select>
              </div>

              {/* Primary Pitch (A) Dropdown */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: '#64748B',
                    marginBottom: '2px',
                  }}
                >
                  2. PRIMARY PITCH (A)
                </label>
                <select
                  value={primaryId}
                  onChange={(e) => setPrimaryId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#F8F9FA',
                    border: '1px solid #CBD5E1',
                    color: '#1E293B',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '5px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {filteredSidebarEvals.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.date} • {ev.pitchName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Compare Pitch (B) Dropdown */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: '#64748B',
                    marginBottom: '2px',
                  }}
                >
                  3. COMPARE PITCH (B)
                </label>
                <select
                  value={compareId}
                  onChange={(e) => setCompareId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#F8F9FA',
                    border: '1px solid #CBD5E1',
                    color: '#1E293B',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '5px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {evaluations.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.date} • {ev.pitchName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reference Baseline Mode Dropdown */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.62rem',
                    fontWeight: 700,
                    color: '#6D28D9',
                    marginBottom: '2px',
                  }}
                >
                  4. REFERENCE RANGE (MEAN ± 1 SD)
                </label>
                <select
                  value={refModeId}
                  onChange={(e) => setRefModeId(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#F8F9FA',
                    border: '1px solid #CBD5E1',
                    color: '#1E293B',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    padding: '5px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  <optgroup label="Empirical Distribution Baselines">
                    {REFERENCE_MODE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Single Pitch (Mean ± 1 SD of 18 Zones)">
                    {evaluations.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.date} • {ev.pitchName}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 3. Navigation Items ("App Modules") */}
        <div
          style={{
            flex: 1,
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto',
          }}
        >
          {!isSidebarCollapsed && (
            <div
              style={{
                fontSize: '0.66rem',
                fontWeight: 800,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0 8px 6px',
              }}
            >
              App Modules
            </div>
          )}

          {(Object.keys(MODULE_META) as ActiveTab[]).map((tabKey) => {
            const item = MODULE_META[tabKey];
            const Icon = item.icon;
            const isActive = activeTab === tabKey && !showMobileView;

            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => {
                  setActiveTab(tabKey);
                  if (showMobileView) setLayoutMode('desktop');
                }}
                title={isSidebarCollapsed ? `${item.label} — ${item.subtitle}` : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                  gap: '10px',
                  padding: isSidebarCollapsed ? '12px 0' : '10px 12px',
                  borderRadius: '8px',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  border: isActive ? '1px solid #E5E9F0' : '1px solid transparent',
                  borderLeft: isActive ? '4px solid #C69214' : '4px solid transparent',
                  boxShadow: isActive ? '0 2px 6px rgba(0, 0, 0, 0.04)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '11px',
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      color: isActive ? '#C69214' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                  </div>
                  {!isSidebarCollapsed && (
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: isActive ? 800 : 600,
                          color: isActive ? '#2E3440' : '#434C5E',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: isActive ? '#434C5E' : '#94A3B8',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '1px',
                        }}
                      >
                        {item.subtitle}
                      </div>
                    </div>
                  )}
                </div>

                {!isSidebarCollapsed && (
                  <span
                    style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '999px',
                      background: isActive ? '#FEF3C7' : '#F1F5F9',
                      color: isActive ? '#92400E' : '#434C5E',
                      flexShrink: 0,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Metric Reference Guide Popup Trigger in Sidebar */}
          <button
            type="button"
            onClick={() => openAppendixA()}
            title={isSidebarCollapsed ? 'Metric Reference Guide (Popup)' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
              gap: '10px',
              padding: isSidebarCollapsed ? '12px 0' : '10px 12px',
              borderRadius: '8px',
              background: appendixAOpen ? '#FFFFFF' : 'transparent',
              border: appendixAOpen ? '1px solid #E5E9F0' : '1px solid transparent',
              borderLeft: appendixAOpen ? '4px solid #C69214' : '4px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              width: '100%',
              marginTop: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
              <div
                style={{
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <BookOpen size={18} strokeWidth={2} />
              </div>
              {!isSidebarCollapsed && (
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      color: '#434C5E',
                    }}
                  >
                    3. Metric Reference Guide
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: '#94A3B8',
                      marginTop: '1px',
                    }}
                  >
                    3-Page PDF &amp; Mean ± SD
                  </div>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '999px',
                  background: '#F1F5F9',
                  color: '#434C5E',
                }}
              >
                Popup
              </span>
            )}
          </button>

          {/* Mobile Fieldside Module Entry in Sidebar */}
          <button
            type="button"
            onClick={() => setLayoutMode(showMobileView ? 'desktop' : 'mobile')}
            title={isSidebarCollapsed ? 'Mobile Fieldside View' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
              gap: '10px',
              padding: isSidebarCollapsed ? '12px 0' : '10px 12px',
              borderRadius: '8px',
              background: showMobileView ? '#FFFFFF' : 'transparent',
              border: showMobileView ? '1px solid #E5E9F0' : '1px solid transparent',
              borderLeft: showMobileView ? '4px solid #C69214' : '4px solid transparent',
              boxShadow: showMobileView ? '0 2px 6px rgba(0, 0, 0, 0.04)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textAlign: 'left',
              width: '100%',
              marginTop: '4px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '11px', minWidth: 0 }}>
              <div
                style={{
                  color: showMobileView ? '#C69214' : '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Smartphone size={18} strokeWidth={showMobileView ? 2.4 : 2} />
              </div>
              {!isSidebarCollapsed && (
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: showMobileView ? 800 : 600,
                      color: showMobileView ? '#2E3440' : '#434C5E',
                    }}
                  >
                    4. Mobile Fieldside
                  </div>
                  <div
                    style={{
                      fontSize: '0.68rem',
                      color: showMobileView ? '#434C5E' : '#94A3B8',
                      marginTop: '1px',
                    }}
                  >
                    Portrait 18-Zone &amp; Gauges
                  </div>
                </div>
              )}
            </div>
            {!isSidebarCollapsed && (
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '999px',
                  background: showMobileView ? '#FEF3C7' : '#F1F5F9',
                  color: showMobileView ? '#92400E' : '#434C5E',
                }}
              >
                iOS/Web
              </span>
            )}
          </button>
        </div>

        {/* 4. Sidebar Footer */}
        <div
          style={{
            padding: '12px 14px',
            borderTop: '1px solid #E5E9F0',
            background: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {isSidebarCollapsed ? (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              title="Expand Sidebar"
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#2E3440',
                width: '100%',
                height: '32px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={16} />
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#C69214',
                    boxShadow: '0 0 6px rgba(198, 146, 20, 0.4)',
                  }}
                />
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#2E3440' }}>
                    Raw Stadia Surface Lab
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 600 }}>
                    18-Zone Impact • Energy • Grip
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ===================================================================
          RIGHT MAIN CONTENT AREA (TopBar + SourceSessionBar + Active Module)
          =================================================================== */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          background: '#F8FAFC',
        }}
      >
        {/* Sticky TopBar */}
        <header
          style={{
            height: '56px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E9F0',
            padding: '0 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          {/* Left: Current Module Title & Subtitle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: '#2E3440',
                  letterSpacing: '-0.01em',
                }}
              >
                {showMobileView
                  ? 'Mobile Fieldside Surface Intelligence'
                  : currentModule.topTitle}
              </h1>
              <div
                className="hidden sm:block"
                style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}
              >
                {showMobileView
                  ? 'Engineered for pitch-side & locker room smartphones (< 768px)'
                  : currentModule.topSubtitle}
              </div>
            </div>
          </div>

          {/* Right: Status Pill, Metric Reference Guide Popup Button, Data Import, and View Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Status Badge */}
            <div
              className="hidden xl:flex"
              style={{
                alignItems: 'center',
                gap: '6px',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                color: '#001489',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
              }}
              title="18-Zone Playing Surface Indexes: Impact, Energy, Grip"
            >
              <ShieldCheck size={13} />
              <span>IMPACT • ENERGY • GRIP (0–10)</span>
            </div>

            {/* Metric Reference Guide Popup Modal Trigger Button */}
            <button
              type="button"
              onClick={() => openAppendixA()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FEF3C7',
                border: '1px solid #C69214',
                color: '#92400E',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
              title="Open Raw Stadia 3-Page Index Guide & Reference Range Methodology"
            >
              <Scale size={13} color="#C69214" />
              <span>Metric Reference Guide</span>
            </button>

            {/* Data Import Button */}
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
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: '#F8F9FA',
                border: '1px solid #CBD5E1',
                color: '#2E3440',
                padding: '6px 12px',
                borderRadius: '7px',
                fontSize: '0.76rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Upload size={13} color="#C69214" />
              <span className="hidden sm:inline">Import CSV</span>
            </button>

            {/* Desktop Hub / Mobile Fieldside Toggle Button */}
            <button
              type="button"
              onClick={() => setLayoutMode(showMobileView ? 'desktop' : 'mobile')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                background: showMobileView
                  ? '#C69214'
                  : 'linear-gradient(135deg, #001489 0%, #1E3A8A 100%)',
                border: '1.5px solid #C69214',
                color: '#FFFFFF',
                padding: '6px 13px',
                borderRadius: '7px',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: showMobileView
                  ? '0 2px 6px rgba(198, 146, 20, 0.25)'
                  : '0 2px 6px rgba(0, 20, 137, 0.2)',
              }}
            >
              {showMobileView ? <Monitor size={14} /> : <Smartphone size={14} />}
              <span>{showMobileView ? 'Desktop Hub' : 'Mobile Fieldside'}</span>
            </button>
          </div>
        </header>

        {/* Optional Upload Feedback Banner */}
        {uploadBanner && (
          <div className="max-w-[1600px] w-full mx-auto px-7 mt-4">
            <div className="bg-emerald-50 border border-emerald-300 rounded-[8px] px-4 py-2.5 flex items-center justify-between text-xs text-emerald-900 font-bold">
              <span>{uploadBanner}</span>
              <button
                type="button"
                onClick={() => setUploadBanner(null)}
                className="text-emerald-800 font-extrabold hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Main Workspace Canvas */}
        <main
          style={{
            flex: 1,
            padding: '24px 28px',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
          className="space-y-5"
        >
          {/* SourceSessionBar-Style Top Control Strip */}
          {!showMobileView && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                background: '#FFFFFF',
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              }}
            >
              <div className="flex flex-wrap items-center gap-3">
                {/* Primary Pitch A */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#001489] mb-0.5">
                    Primary Pitch (Pitch A)
                  </label>
                  <select
                    value={primaryId}
                    onChange={(e) => setPrimaryId(e.target.value)}
                    className="bg-[#F8F9FA] border border-[#CBD5E1] rounded-[6px] px-2.5 py-1.5 text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#001489] cursor-pointer"
                  >
                    <optgroup label="Match Day Stadiums">
                      {evaluations
                        .filter((e) => !e.pitchName.startsWith('USSF Super'))
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.date} • {e.pitchName} (Imp {e.averages.Impact.toFixed(1)} | Grip{' '}
                            {e.averages.Grip.toFixed(1)})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="NTC Training Fields (Super 3, 4, 5)">
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

                {/* Swap A / B Button */}
                <button
                  type="button"
                  onClick={() => {
                    const temp = primaryId;
                    setPrimaryId(compareId);
                    setCompareId(temp);
                  }}
                  className="mt-4 p-2 rounded-[7px] bg-[#F8F9FA] border border-[#CBD5E1] hover:border-[#C69214] text-[#2E3440] transition-all"
                  title="Swap Pitch A and Pitch B"
                >
                  <ArrowLeftRight className="w-4 h-4 text-[#C69214]" />
                </button>

                {/* Compare Pitch B */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#92400E] mb-0.5">
                    Compare Pitch (Pitch B)
                  </label>
                  <select
                    value={compareId}
                    onChange={(e) => setCompareId(e.target.value)}
                    className="bg-[#F8F9FA] border border-[#CBD5E1] rounded-[6px] px-2.5 py-1.5 text-xs font-bold text-[#1E293B] focus:outline-none focus:border-[#C69214] cursor-pointer"
                  >
                    <optgroup label="Match Day Stadiums">
                      {evaluations
                        .filter((e) => !e.pitchName.startsWith('USSF Super'))
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.date} • {e.pitchName} (Imp {e.averages.Impact.toFixed(1)} | Grip{' '}
                            {e.averages.Grip.toFixed(1)})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="NTC Training Fields (Super 3, 4, 5)">
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

                {/* Reference Range Baseline Mode Selector */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-purple-700 mb-0.5">
                    Reference Range &amp; Purple REF Line
                  </label>
                  <select
                    value={refModeId}
                    onChange={(e) => setRefModeId(e.target.value)}
                    className="bg-purple-50/60 border border-purple-300 rounded-[6px] px-2.5 py-1.5 text-xs font-bold text-purple-900 focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <optgroup label="Empirical Distribution Baselines (Mean ± 1 SD)">
                      {REFERENCE_MODE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Single Pitch Baseline (Mean ± 1 SD of 18 Zones)">
                      {evaluations.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.date} • {ev.pitchName}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Right Quick Reference Range Summary Pill */}
              <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3.5 py-2">
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-purple-800 flex items-center gap-1.5">
                    <span>Active Reference Band ({referenceProfile.shortLabel} • Mean ± 1 SD)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 mt-0.5 font-mono text-xs">
                    <span className="text-[#2E3440]">
                      <strong className="text-[#001489]">Impact:</strong>{' '}
                      {referenceProfile.metrics.Impact.bandLow.toFixed(2)}–
                      {referenceProfile.metrics.Impact.bandHigh.toFixed(2)}
                    </span>
                    <span className="text-[#CBD5E1]">|</span>
                    <span className="text-[#2E3440]">
                      <strong className="text-[#001489]">Energy:</strong>{' '}
                      {referenceProfile.metrics.Energy.bandLow.toFixed(2)}–
                      {referenceProfile.metrics.Energy.bandHigh.toFixed(2)}
                    </span>
                    <span className="text-[#CBD5E1]">|</span>
                    <span className="text-[#2E3440]">
                      <strong className="text-[#001489]">Grip:</strong>{' '}
                      {referenceProfile.metrics.Grip.bandLow.toFixed(2)}–
                      {referenceProfile.metrics.Grip.bandHigh.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW MODE: MOBILE FIELDSIDE PREVIEW OR DESKTOP MODULE
              =================================================================== */}
          {showMobileView ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-2">
              {/* Left 5 Columns: Explanation of Mobile Fieldside Ergonomics */}
              <div
                className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-[10px] p-6 space-y-4"
                style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-xs font-extrabold">
                  <Smartphone className="w-4 h-4 text-[#C69214]" />
                  Mobile-First Fieldside Experience
                </div>
                <h2 className="text-2xl font-black text-[#2E3440] tracking-tight">
                  Engineered for Pitch-Side &amp; Locker Room Mobile Use
                </h2>
                <p className="text-xs text-[#434C5E] font-medium leading-relaxed">
                  When opened on a smartphone (
                  <code className="text-[#001489] font-bold">&lt; 768px</code>), the hub
                  automatically launches into this dedicated{' '}
                  <strong className="text-[#2E3440]">Mobile Fieldside View</strong> focused strictly
                  on the 3 Raw Stadia Playing Surface Indexes (<strong>Impact</strong>,{' '}
                  <strong>Energy</strong>, and <strong>Grip</strong>):
                </p>
                <div className="space-y-3 text-xs text-[#434C5E]">
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] border-l-[4px] border-l-[#001489] rounded-[8px] p-3.5">
                    <strong className="text-[#001489] block text-sm font-extrabold mb-0.5">
                      1. Stacked 0–10 REF Gauges (Impact • Energy • Grip)
                    </strong>
                    Compares <strong>Pitch A</strong>, <strong>Pitch B</strong>, and the{' '}
                    <strong>Empirical Reference Band (Mean ± 1 SD)</strong> with expandable 18-zone
                    mini-maps and Raw Stadia PDF spectrum watch tags.
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] border-l-[4px] border-l-[#C69214] rounded-[8px] p-3.5">
                    <strong className="text-[#92400E] block text-sm font-extrabold mb-0.5">
                      2. Portrait Goal-to-Goal 18-Zone Pitch Map
                    </strong>
                    Rotates the 3×6 Raw Stadia grid into a vertical Goal-to-Goal orientation (3
                    columns wide × 6 rows long) so every zone button is a 56px thumb target without
                    horizontal pinch-zooming.
                  </div>
                  <div className="bg-[#F8FAFC] border border-[#E2E8F0] border-l-[4px] border-l-emerald-600 rounded-[8px] p-3.5">
                    <strong className="text-emerald-800 block text-sm font-extrabold mb-0.5">
                      3. Embedded 3-Page PDF Guide &amp; Reference Methodology
                    </strong>
                    Quick pitch-side access to the official Raw Stadia definitions for{' '}
                    <strong>Impact</strong>, <strong>Energy</strong>, and <strong>Grip</strong>.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLayoutMode('desktop')}
                  className="px-4 py-2.5 rounded-[7px] bg-[#001489] hover:bg-[#1E3A8A] text-white text-xs font-extrabold border border-[#C69214] shadow-sm"
                >
                  ← Return to Full Desktop Hub
                </button>
              </div>

              {/* Right 7 Columns: Live Interactive Mobile Device Frame */}
              <div className="lg:col-span-7 flex justify-center">
                <MobileFieldsideView
                  evaluations={evaluations}
                  primaryEval={primaryEval}
                  compareEval={compareEval}
                  referenceProfile={referenceProfile}
                  primaryId={primaryId}
                  compareId={compareId}
                  refModeId={refModeId}
                  onSelectPrimary={setPrimaryId}
                  onSelectCompare={setCompareId}
                  onSelectRefMode={setRefModeId}
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
                  <div
                    className="bg-white border border-[#E2E8F0] border-l-[4px] border-l-[#C69214] rounded-[10px] p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                    style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-xs font-extrabold uppercase tracking-[0.06em] px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#001489] border border-[#BFDBFE]">
                          Primary Pitch A • {primaryEval.date}
                        </span>
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                          Session Context: {primaryEval.sessionObjective}
                        </span>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${primarySpread.badgeClass}`}
                        >
                          {primarySpread.consistencyLabel} (Uniformity: {primaryEval.uniformityScore}%)
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-[#2E3440]">
                        {primaryEval.pitchName}{' '}
                        <span className="text-sm font-semibold text-[#64748B]">
                          ({primaryEval.venue})
                        </span>
                      </h2>
                      <p className="text-xs text-[#434C5E] font-medium mt-1 max-w-4xl leading-relaxed">
                        {primaryEval.notes}
                      </p>
                    </div>

                    {/* 3 Core Indexes Quick Readout on Top Right */}
                    <div className="grid grid-cols-3 gap-2.5 min-w-[330px] font-mono">
                      {(['Impact', 'Energy', 'Grip'] as IndexName[]).map((m) => (
                        <div
                          key={m}
                          onClick={() => setActiveMetric(m)}
                          className="cursor-pointer bg-[#F8FAFC] hover:border-[#C69214] border border-[#E2E8F0] rounded-[8px] p-3 text-center transition-all"
                        >
                          <div className="text-[10px] font-sans font-extrabold uppercase text-[#64748B]">
                            {m}
                          </div>
                          <div className="text-lg font-black text-[#001489]">
                            {primaryEval.averages[m].toFixed(2)}
                          </div>
                          <div className="text-[10px] text-[#434C5E] font-semibold">
                            ±{primaryEval.stdDevs[m].toFixed(2)} SD
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Section 1A: Core Surface Performance Triad (Comparing Pitch A + Pitch B + Empirical REF) */}
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3 bg-white border border-[#E2E8F0] rounded-[10px] px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Layers className="w-4 h-4 text-[#C69214]" />
                        <h3 className="text-sm font-extrabold uppercase tracking-[0.06em] text-[#2E3440]">
                          1A. Core Surface Performance Triad — 3-Pitch Comparison:{' '}
                          <span className="text-[#001489]">{primaryEval.pitchName}</span> vs{' '}
                          <span className="text-[#92400E]">{compareEval.pitchName}</span> vs{' '}
                          <span className="text-purple-700">
                            {referenceProfile.shortLabel} (Mean ± 1 SD)
                          </span>
                        </h3>
                      </div>

                      {/* Synchronized 4-Mode 18-Zone Mini-Pitch Switcher */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B]">
                          18-Zone Mini-Maps:
                        </span>
                        <div className="inline-flex items-center bg-[#F1F5F9] p-1 rounded-[7px] border border-[#E2E8F0]">
                          {(
                            [
                              { id: 'stackAB', label: 'Stack A & B Maps' },
                              { id: 'pitchA', label: 'Pitch A Only' },
                              { id: 'pitchB', label: 'Pitch B Only' },
                              { id: 'deltaAB', label: 'Δ Zone Diff (A − B)' },
                            ] as { id: TriadMiniMapMode; label: string }[]
                          ).map((mode) => {
                            const active = triadMapMode === mode.id;
                            return (
                              <button
                                key={mode.id}
                                type="button"
                                onClick={() => setTriadMapMode(mode.id)}
                                className={`px-2.5 py-1 rounded-[5px] text-[11px] font-extrabold transition-all ${
                                  active
                                    ? 'bg-[#001489] text-white shadow-sm'
                                    : 'text-[#434C5E] hover:text-[#2E3440]'
                                }`}
                              >
                                {mode.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <RefGaugeCard
                        metric="Impact"
                        value={primaryEval.averages.Impact}
                        primarySd={primaryEval.stdDevs.Impact}
                        primaryLabel={primaryEval.pitchName}
                        compareValue={compareEval.averages.Impact}
                        compareSd={compareEval.stdDevs.Impact}
                        compareLabel={compareEval.pitchName}
                        refStats={referenceProfile.metrics.Impact}
                        refLabel={referenceProfile.shortLabel}
                        zones={primaryEval.zones}
                        compareZones={compareEval.zones}
                        miniMapMode={triadMapMode}
                        selectedZone={selectedZone}
                        onOpenAppendixA={openAppendixA}
                        onSelectZone={(z) => {
                          setSelectedZone(z);
                          setActiveMetric('Impact');
                        }}
                      />
                      <RefGaugeCard
                        metric="Energy"
                        value={primaryEval.averages.Energy}
                        primarySd={primaryEval.stdDevs.Energy}
                        primaryLabel={primaryEval.pitchName}
                        compareValue={compareEval.averages.Energy}
                        compareSd={compareEval.stdDevs.Energy}
                        compareLabel={compareEval.pitchName}
                        refStats={referenceProfile.metrics.Energy}
                        refLabel={referenceProfile.shortLabel}
                        zones={primaryEval.zones}
                        compareZones={compareEval.zones}
                        miniMapMode={triadMapMode}
                        selectedZone={selectedZone}
                        onOpenAppendixA={openAppendixA}
                        onSelectZone={(z) => {
                          setSelectedZone(z);
                          setActiveMetric('Energy');
                        }}
                      />
                      <RefGaugeCard
                        metric="Grip"
                        value={primaryEval.averages.Grip}
                        primarySd={primaryEval.stdDevs.Grip}
                        primaryLabel={primaryEval.pitchName}
                        compareValue={compareEval.averages.Grip}
                        compareSd={compareEval.stdDevs.Grip}
                        compareLabel={compareEval.pitchName}
                        refStats={referenceProfile.metrics.Grip}
                        refLabel={referenceProfile.shortLabel}
                        zones={primaryEval.zones}
                        compareZones={compareEval.zones}
                        miniMapMode={triadMapMode}
                        selectedZone={selectedZone}
                        onOpenAppendixA={openAppendixA}
                        onSelectZone={(z) => {
                          setSelectedZone(z);
                          setActiveMetric('Grip');
                        }}
                      />
                    </div>
                  </div>

                  {/* Section 1B: Interactive 18-Zone Spatial Surface Map */}
                  <div id="spatial-18-zone-section">
                    <PitchHeatmap18Zone
                      evaluation={primaryEval}
                      comparisonEval={compareEval}
                      referenceProfile={referenceProfile}
                      activeMetric={activeMetric}
                      onSelectMetric={setActiveMetric}
                      selectedZone={selectedZone}
                      onSelectZone={setSelectedZone}
                    />
                  </div>

                  {/* Section 1C: Visual Head-to-Head Pitch A vs Pitch B vs REF (3-Axis Triad + Visual Spectrum Bars) */}
                  <HeadToHeadVisualComparison
                    primaryEval={primaryEval}
                    compareEval={compareEval}
                    referenceProfile={referenceProfile}
                    onOpenSpatialMap={() => {
                      const el = document.getElementById('spatial-18-zone-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    onOpenAppendixA={openAppendixA}
                  />
                </>
              )}

              {activeTab === 'timeline' && (
                <LongitudinalTimeline
                  evaluations={evaluations}
                  referenceProfile={referenceProfile}
                  selectedPrimaryId={primaryId}
                  selectedCompareId={compareId}
                  onSelectPrimary={(id) => {
                    setPrimaryId(id);
                    setActiveTab('comparator');
                  }}
                  onSelectCompare={(id) => {
                    setCompareId(id);
                    setActiveTab('comparator');
                  }}
                  onOpenAppendixA={openAppendixA}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Contextual Metric Reference Guide Popup Modal */}
      <AppendixAModal
        isOpen={appendixAOpen}
        onClose={() => setAppendixAOpen(false)}
        highlightedKey={appendixAHighlight}
        referenceProfile={referenceProfile}
      />
    </div>
  );
}

export default App;
