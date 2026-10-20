import React, { useEffect, useState } from 'react';
import { BookOpen, Info, Scale, Search, ShieldCheck, X } from 'lucide-react';
import { APPENDIX_A_DEFINITIONS, RAW_STADIA_KNOWLEDGE_SPECS } from '../data/rawStadiaKnowledge';

export interface AppendixAEntry {
  key: string;
  term: string;
  category: 'Core Index (0–10)' | 'RAA Vertical Hardware' | 'RTT Rotational Hardware';
  optimalBand: string;
  instrument: string;
  definition: string;
  clinicalTakeaway: string;
}

export const ENRICHED_APPENDIX_A: AppendixAEntry[] = [
  {
    key: 'Impact',
    term: 'Impact Index (0–10 Scale)',
    category: 'Core Index (0–10)',
    optimalBand: '4.0 – 6.0 / 10',
    instrument: 'Raw Artificial Athlete (RAA) Composite',
    definition:
      'Quantifies overall surface firmness, compaction, and vertical force attenuation during foot strike. Lower scores (< 3.5) indicate a soft, compliant, energy-absorbing pitch; higher scores (> 6.5) indicate a firm, compact, high-deceleration surface.',
    clinicalTakeaway:
      'High Impact (> 6.5) elevates peak tibial shock and Achilles/patellar tendon loading; Low Impact (< 3.5) increases eccentric muscular fatigue.',
  },
  {
    key: 'Energy',
    term: 'Energy Index (0–10 Scale)',
    category: 'Core Index (0–10)',
    optimalBand: '3.8 – 5.5 / 10',
    instrument: 'Raw Artificial Athlete (RAA) Rebound',
    definition:
      'Measures elastic energy return (springiness vs. damping) when an athlete pushes off the turf. Low scores (< 3.5) mean the surface dissipates mechanical work; high scores (> 5.5) mean the surface returns elastic energy rapidly.',
    clinicalTakeaway:
      'Higher Energy relative to Impact improves running economy and supports MD+1 regeneration; Low Energy increases metabolic heart-rate cost.',
  },
  {
    key: 'Grip',
    term: 'Grip Index (0–10 Scale)',
    category: 'Core Index (0–10)',
    optimalBand: '5.5 – 7.2 / 10',
    instrument: 'Rotational Traction Tester (RTT) Composite',
    definition:
      'Quantifies rotational and linear shear traction between cleat studs and the rootzone during planting, cutting, and deceleration.',
    clinicalTakeaway:
      'Values ≥ 8.0 create excessive rotational foot fixation (stud lock), elevating knee/ankle torque; values < 5.0 increase slipping risk and require longer studs.',
  },
  ...APPENDIX_A_DEFINITIONS.map((d) => {
    let key = d.term;
    let cat: AppendixAEntry['category'] = 'RAA Vertical Hardware';
    let takeaway =
      'Used alongside the 0–10 indices to diagnose rootzone moisture, compaction, and cleat selection.';

    if (d.term.includes('Hardness')) {
      key = 'Hardness';
      cat = 'RAA Vertical Hardware';
      takeaway =
        'Values > 85 Gm indicate hard, compact soil; values < 60 Gm indicate soft, wet, or heavily aerated turf.';
    } else if (d.term.includes('Shock Absorption')) {
      key = 'ShockAbsorption';
      cat = 'RAA Vertical Hardware';
      takeaway =
        'Higher % means greater cushioning relative to concrete; below 55% signals high lower-limb impact stress.';
    } else if (d.term.includes('Energy Restitution')) {
      key = 'EnergyRestitution';
      cat = 'RAA Vertical Hardware';
      takeaway =
        'Measures vertical rebound efficiency; higher % produces a faster, springier pitch feel.';
    } else if (d.term.includes('Rotational Resistance')) {
      key = 'RotationalTorque';
      cat = 'RTT Rotational Hardware';
      takeaway =
        'Peak torque > 52 Nm warns of excessive stud lock; < 30 Nm warns of loss of footing during sharp cuts.';
    } else if (d.term.includes('Stud Penetration')) {
      key = 'StudDepth';
      cat = 'RTT Rotational Hardware';
      takeaway =
        'Primary driver of cleat stud length: < 9.0 mm requires shorter FG-S studs; > 12.0 mm allows Mixed/SG metal studs.';
    } else if (d.term.includes('Boot')) {
      key = 'Boot';
      cat = 'RTT Rotational Hardware';
      takeaway =
        '< 2.2 = SG Metal | 2.2–4.0 = Mixed SG/FG | 4.0–5.3 = FG-L | 5.3–7.2 = FG-S Conical | > 7.2 = AG.';
    }

    return {
      key,
      term: d.term,
      category: cat,
      optimalBand: d.optimalBand,
      instrument: d.instrument,
      definition: d.definition,
      clinicalTakeaway: takeaway,
    };
  }),
];

interface MetricInfoTriggerProps {
  metricKey: string;
  onOpenModal: (metricKey: string) => void;
  label?: string;
}

export const MetricInfoTrigger: React.FC<MetricInfoTriggerProps> = ({
  metricKey,
  onOpenModal,
  label,
}) => {
  const entry =
    ENRICHED_APPENDIX_A.find(
      (e) =>
        e.key.toLowerCase() === metricKey.toLowerCase() ||
        e.term.toLowerCase().includes(metricKey.toLowerCase())
    ) || ENRICHED_APPENDIX_A[0];

  return (
    <span className="relative inline-flex items-center group">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenModal(entry.key);
        }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] hover:border-[#001489] text-[#64748B] hover:text-[#001489] text-[10px] font-extrabold transition-colors cursor-pointer"
        title={`View Appendix A definition for ${entry.term}`}
      >
        <Info className="w-3 h-3 text-[#C69214]" />
        {label && <span>{label}</span>}
      </button>

      {/* Instant Hover Popover Preview */}
      <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 z-50 bg-white border border-[#CBD5E1] rounded-[10px] p-3 shadow-xl text-left">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-[11px] font-black text-[#2E3440]">{entry.term}</span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
            Opt: {entry.optimalBand}
          </span>
        </div>
        <div className="text-[9px] font-mono font-bold uppercase text-[#C69214] mb-1">
          {entry.instrument}
        </div>
        <p className="text-[11px] text-[#434C5E] font-normal leading-snug">{entry.definition}</p>
        <div className="mt-1.5 pt-1.5 border-t border-[#E2E8F0] text-[10px] font-bold text-[#001489]">
          Click icon to open full Appendix A Popup →
        </div>
      </div>
    </span>
  );
};

interface AppendixAModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightedKey?: string | null;
}

export const AppendixAModal: React.FC<AppendixAModalProps> = ({
  isOpen,
  onClose,
  highlightedKey,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredEntries = ENRICHED_APPENDIX_A.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.term.toLowerCase().includes(q) ||
      item.definition.toLowerCase().includes(q) ||
      item.instrument.toLowerCase().includes(q) ||
      item.clinicalTakeaway.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#CBD5E1] rounded-[14px] w-full max-w-4xl max-h-[86vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (mnt-data-management StagingModal style) */}
        <div className="px-6 py-4 bg-white border-b border-[#E5E9F0] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-[8px] flex items-center justify-center border border-[#C69214] shrink-0"
              style={{
                background: 'linear-gradient(135deg, #001489 0%, #1E3A8A 100%)',
              }}
            >
              <Scale className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                  Appendix A • Popup Reference
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> FIFA &amp; Raw Stadia
                  Benchmarks
                </span>
              </div>
              <h3 className="text-lg font-black text-[#2E3440] mt-0.5">
                Surface Characteristic &amp; Physical Hardware Definitions
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[7px] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] flex items-center justify-center text-[#434C5E] transition-colors"
            title="Close Appendix A (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-b border-[#E5E9F0] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Definitions (9)' },
              { id: 'Core Index (0–10)', label: '0–10 Core Indices (3)' },
              { id: 'RAA Vertical Hardware', label: 'RAA Vertical Tester (3)' },
              { id: 'RTT Rotational Hardware', label: 'RTT Rotational Tester (3)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1 rounded-[6px] text-xs border transition-all ${
                  categoryFilter === tab.id
                    ? 'bg-[#001489] text-white border-[#C69214] font-extrabold'
                    : 'bg-white text-[#434C5E] border-[#CBD5E1] font-semibold hover:border-[#C69214]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px] flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search metric, unit (Gm, Nm, mm)..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#CBD5E1] rounded-[6px] text-xs font-semibold text-[#2E3440] focus:outline-none focus:border-[#001489]"
            />
          </div>
        </div>

        {/* Scrollable Definitions Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEntries.map((item) => {
              const isHighlighted =
                highlightedKey &&
                (item.key.toLowerCase() === highlightedKey.toLowerCase() ||
                  item.term.toLowerCase().includes(highlightedKey.toLowerCase()));

              return (
                <div
                  key={item.key}
                  className={`rounded-[10px] p-4 border transition-all flex flex-col justify-between ${
                    isHighlighted
                      ? 'bg-[#EFF6FF] border-2 border-[#001489] ring-2 ring-[#C69214]/40 shadow-md'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#C69214]'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.05em] text-[#C69214] block">
                          {item.category} • {item.instrument}
                        </span>
                        <h4 className="text-sm font-black text-[#2E3440] mt-0.5">{item.term}</h4>
                      </div>
                      <span className="text-[11px] font-mono font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 whitespace-nowrap shrink-0">
                        Opt: {item.optimalBand}
                      </span>
                    </div>

                    <p className="text-xs text-[#434C5E] font-medium leading-relaxed mt-2">
                      {item.definition}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] text-[11px] text-[#001489] font-semibold">
                    <strong className="font-extrabold uppercase text-[10px] tracking-wider text-[#2E3440] mr-1">
                      Practitioner Takeaway:
                    </strong>
                    {item.clinicalTakeaway}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Training Goal Equations Quick-Reference inside Modal */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-[#C69214]" />
              <span className="text-xs font-extrabold uppercase tracking-[0.06em] text-[#2E3440]">
                6 Training Goal Suitability Scores (0–10 Closed-Form Equations)
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {RAW_STADIA_KNOWLEDGE_SPECS.filter((s) => s.category === 'Training Goal Index').map((s) => (
                <div key={s.name} className="bg-white border border-[#E2E8F0] rounded-[7px] p-2.5">
                  <div className="font-extrabold text-[#001489]">{s.name}</div>
                  <div className="text-[10px] font-mono font-bold text-[#64748B] mt-0.5">
                    {s.formulaDisplay}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E5E9F0] flex items-center justify-between text-xs text-[#64748B] shrink-0">
          <span className="font-medium">
            Tip: Click any <strong className="text-[#2E3440]">ⓘ</strong> icon next to a metric on
            the dashboard to jump straight to its definition.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[7px] bg-[#001489] hover:bg-[#1E3A8A] text-white font-extrabold border border-[#C69214]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
