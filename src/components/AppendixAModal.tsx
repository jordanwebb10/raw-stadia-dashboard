import React, { useEffect } from 'react';
import { BookOpen, Info, Scale, ShieldCheck, X } from 'lucide-react';
import { getKnowledgeSpec, RAW_STADIA_KNOWLEDGE_SPECS } from '../data/rawStadiaKnowledge';
import { IndexName, ReferenceBaselineProfile } from '../types/rawStadia';
import { JOSE_REPORT_SCALE_BANDS } from '../utils/rawStadiaEngine';

interface MetricInfoTriggerProps {
  metricKey: IndexName;
  onOpenModal: (metricKey: IndexName) => void;
  label?: string;
}

export const MetricInfoTrigger: React.FC<MetricInfoTriggerProps> = ({
  metricKey,
  onOpenModal,
  label,
}) => {
  const spec = getKnowledgeSpec(metricKey);
  const joseBand = JOSE_REPORT_SCALE_BANDS[metricKey];

  return (
    <span className="relative inline-flex items-center group">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenModal(metricKey);
        }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] hover:border-[#001489] text-[#64748B] hover:text-[#001489] text-[10px] font-extrabold transition-colors cursor-pointer"
        title={`View Reference Guide for ${spec.name}`}
      >
        <Info className="w-3 h-3 text-[#C69214]" />
        {label && <span>{label}</span>}
      </button>

      {/* Instant Hover Popover Preview */}
      <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 z-50 bg-white border border-[#CBD5E1] rounded-[10px] p-3 shadow-xl text-left">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-xs font-black uppercase text-[#001489]">{spec.name}</span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
            Report Green: {joseBand.desirableZoneMap[0].toFixed(1)}–{joseBand.desirableZoneMap[1].toFixed(1)}
          </span>
        </div>
        <div className="text-[9px] font-mono font-bold uppercase text-[#C69214] mb-1">
          {spec.hardwareTester} • {spec.mechanicalProperties.join(', ')}
        </div>
        <p className="text-[11px] text-[#434C5E] font-normal leading-snug">{spec.subtitle}</p>
        <div className="mt-1.5 pt-1.5 border-t border-[#E2E8F0] text-[10px] font-bold text-[#001489]">
          Click to open full Impact / Energy / Grip Reference Popup →
        </div>
      </div>
    </span>
  );
};

interface AppendixAModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightedKey?: IndexName | string | null;
  referenceProfile?: ReferenceBaselineProfile;
}

export const AppendixAModal: React.FC<AppendixAModalProps> = ({
  isOpen,
  onClose,
  highlightedKey,
  referenceProfile,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
        className="bg-white border border-[#CBD5E1] rounded-[14px] w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden"
        style={{ boxShadow: '0 20px 50px rgba(0, 0, 0, 0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
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
                  Raw Stadia | US Soccer — Playing Surface Indexes
                </span>
                <span className="text-[11px] font-mono font-bold text-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Impact • Energy • Grip
                </span>
              </div>
              <h3 className="text-lg font-black text-[#2E3440] mt-0.5">
                Core Surface Index Reference &amp; Reference Range Methodology
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[7px] bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] flex items-center justify-center text-[#434C5E] transition-colors"
            title="Close Reference Guide (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. Reference Range Methodology Explainer + Jose's Report Hard Reference Bands */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] border-l-[4px] border-l-[#7C3AED] rounded-[10px] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#7C3AED]" />
                <h4 className="text-xs font-extrabold uppercase tracking-[0.06em] text-[#2E3440]">
                  Hard Reference Ranges (Jose&apos;s Field Status Reports) &amp; Empirical Baselines
                </h4>
              </div>
              {referenceProfile && (
                <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                  Active Mode: {referenceProfile.label}
                </span>
              )}
            </div>
            <p className="text-xs text-[#434C5E] leading-relaxed">
              Every gauge bar in the dashboard displays the exact <strong>5-band 0–10 reference scale</strong> extracted from{' '}
              <strong>José María Oliva Lozano&apos;s USMNT Field Status Reports</strong> (measured from the report gauge bars in{' '}
              <code>media_7.png</code> and cross-referenced against his 10 camp HTML email reports), overlaid with your active{' '}
              <strong className="text-purple-800">Purple REF Line</strong> and{' '}
              <strong className="text-emerald-800">Active Reference Band</strong>:
            </p>

            {/* 5-Band Hard Reference Table from Jose's Reports */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px] bg-white border border-[#E2E8F0] rounded-[8px] overflow-hidden">
                <thead>
                  <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-[10px] font-extrabold uppercase text-[#434C5E]">
                    <th className="py-2 px-3">Index</th>
                    <th className="py-2 px-2.5">Outer Low</th>
                    <th className="py-2 px-2.5">Marginal Low</th>
                    <th className="py-2 px-2.5 bg-emerald-50 text-emerald-900">Report Green Band</th>
                    <th className="py-2 px-2.5">Marginal High</th>
                    <th className="py-2 px-2.5">Outer High</th>
                    <th className="py-2 px-3">HTML Email &amp; Pitch Map Cutoffs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] font-mono">
                  {(['Impact', 'Energy', 'Grip'] as IndexName[]).map((m) => {
                    const jb = JOSE_REPORT_SCALE_BANDS[m];
                    return (
                      <tr key={m}>
                        <td className="py-2 px-3 font-sans font-black text-[#001489]">{m}</td>
                        <td className="py-2 px-2.5 text-[#64748B]">
                          {jb.outerLow[0].toFixed(1)}–{jb.outerLow[1].toFixed(1)} ({jb.segmentWidthsPct[0]}%)
                        </td>
                        <td className="py-2 px-2.5 text-[#434C5E]">
                          {jb.marginalLow[0].toFixed(1)}–{jb.marginalLow[1].toFixed(1)} ({jb.segmentWidthsPct[1]}%)
                        </td>
                        <td className="py-2 px-2.5 bg-emerald-50/70 font-extrabold text-emerald-800">
                          {jb.desirableGauge[0].toFixed(1)}–{jb.desirableGauge[1].toFixed(1)} ({jb.segmentWidthsPct[2]}%)
                        </td>
                        <td className="py-2 px-2.5 text-[#434C5E]">
                          {jb.marginalHigh[0].toFixed(1)}–{jb.marginalHigh[1].toFixed(1)} ({jb.segmentWidthsPct[3]}%)
                        </td>
                        <td className="py-2 px-2.5 text-[#64748B]">
                          {jb.outerHigh[0].toFixed(1)}–{jb.outerHigh[1].toFixed(1)} ({jb.segmentWidthsPct[4]}%)
                        </td>
                        <td className="py-2 px-3 font-sans text-[10.5px] text-[#434C5E]">
                          {jb.emailEvidenceSummary}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {referenceProfile && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs pt-1">
                {(['Impact', 'Energy', 'Grip'] as IndexName[]).map((m) => {
                  const st = referenceProfile.metrics[m];
                  return (
                    <div
                      key={m}
                      className="bg-white border border-[#E2E8F0] rounded-[8px] p-3 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-sans text-[10px] font-extrabold uppercase text-[#001489] block">
                          Active {m} Reference
                        </span>
                        <strong className="text-sm font-black text-[#2E3440]">
                          REF {st.mean.toFixed(2)} ± {st.sd.toFixed(2)} SD
                        </strong>
                      </div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Band: {st.bandMin.toFixed(2)}–{st.bandMax.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. The 3 Official Pages from "Raw Stadia | US Soccer - Indexes.pdf" */}
          <div className="space-y-5">
            {RAW_STADIA_KNOWLEDGE_SPECS.map((spec) => {
              const isHighlighted = highlightedKey === spec.name;
              const refSt = referenceProfile?.metrics[spec.name];

              return (
                <div
                  key={spec.name}
                  className={`rounded-[12px] border p-5 transition-all ${
                    isHighlighted
                      ? 'bg-[#EFF6FF]/60 border-2 border-[#001489] ring-2 ring-[#C69214]/40 shadow-md'
                      : 'bg-white border-[#E2E8F0]'
                  }`}
                >
                  {/* Metric Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3 mb-4 border-b border-[#E5E9F0]">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl font-black uppercase tracking-[0.06em] text-[#001489]">
                          {spec.name}
                        </span>
                        <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded bg-[#F1F5F9] text-[#434C5E] border border-[#CBD5E1]">
                          {spec.hardwareTester}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[#2E3440] mt-1">{spec.subtitle}</p>
                      <p className="text-[11px] text-[#64748B] font-medium mt-0.5">
                        <strong className="text-[#434C5E]">Mechanical properties:</strong>{' '}
                        {spec.mechanicalProperties.join(', ')}
                      </p>
                    </div>

                    {refSt && (
                      <div className="bg-emerald-50 border border-emerald-300 rounded-[8px] px-3 py-1.5 text-right font-mono">
                        <span className="text-[9px] font-sans font-extrabold uppercase tracking-wider text-emerald-900 block">
                          Active Reference Band (Mean ± 1 SD)
                        </span>
                        <span className="text-xs font-black text-emerald-800">
                          {refSt.bandMin.toFixed(2)} – {refSt.bandMax.toFixed(2)} (REF {refSt.mean.toFixed(2)})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Verbatim Quote */}
                  <blockquote className="bg-[#F8FAFC] border-l-[4px] border-l-[#C69214] px-4 py-2.5 rounded-r-[8px] text-xs italic text-[#2E3440] font-medium mb-4">
                    &ldquo;{spec.quote}&rdquo;
                  </blockquote>

                  {/* 2-Column Spectrum Table (Exact PDF Layout) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Pole (Low Spectrum: Soft / Dissipating / Low Traction) */}
                    <div className="rounded-[10px] border border-emerald-300 bg-emerald-50/45 p-4 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <span className="text-xs font-black uppercase tracking-[0.06em] text-emerald-950">
                          ← {spec.lowSpectrum.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-800">
                          Lower {spec.name}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-[#64748B] block">
                            Load Profile
                          </span>
                          <strong className="text-[#2E3440] font-extrabold">
                            {spec.lowSpectrum.loadLabel}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-[#64748B] block">
                            {spec.lowSpectrum.secondaryAttributeLabel || 'Feels'}
                          </span>
                          <strong className="text-[#2E3440] font-extrabold">
                            {spec.lowSpectrum.feelsLabel}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-[#64748B] block">
                            Used For
                          </span>
                          <strong className="text-[#001489] font-extrabold">
                            {spec.lowSpectrum.usedFor}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-[#64748B] block">
                            Tactical Use
                          </span>
                          <strong className="text-[#2E3440] font-extrabold">
                            {spec.lowSpectrum.tacticalUse}
                          </strong>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-extrabold uppercase text-[#64748B]">
                          Suggested Tissue / Injury Watch:
                        </span>
                        <span className="font-extrabold text-[#92400E] bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                          {spec.lowSpectrum.injuryRiskWatch}
                        </span>
                      </div>
                    </div>

                    {/* Right Pole (High Spectrum: Hard / Rebounding / High Traction) */}
                    <div className="rounded-[10px] border border-emerald-300 bg-emerald-50/45 p-4 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-emerald-200 pb-2">
                        <span className="text-xs font-black uppercase tracking-[0.06em] text-emerald-950">
                          {spec.highSpectrum.title} →
                        </span>
                        <span className="text-[10px] font-mono font-bold text-emerald-800">
                          Higher {spec.name}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-[#64748B] block">
                            Load Profile
                          </span>
                          <strong className="text-[#2E3440] font-extrabold">
                            {spec.highSpectrum.loadLabel}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-[#64748B] block">
                            {spec.highSpectrum.secondaryAttributeLabel || 'Feels'}
                          </span>
                          <strong className="text-[#2E3440] font-extrabold">
                            {spec.highSpectrum.feelsLabel}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-[#64748B] block">
                            Used For
                          </span>
                          <strong className="text-[#001489] font-extrabold">
                            {spec.highSpectrum.usedFor}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold uppercase text-[#64748B] block">
                            Tactical Use
                          </span>
                          <strong className="text-[#2E3440] font-extrabold">
                            {spec.highSpectrum.tacticalUse}
                          </strong>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-extrabold uppercase text-[#64748B]">
                          Suggested Tissue / Injury Watch:
                        </span>
                        <span className="font-extrabold text-[#DA291C] bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px]">
                          {spec.highSpectrum.injuryRiskWatch}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F8FAFC] border-t border-[#E5E9F0] flex items-center justify-between text-xs text-[#64748B] shrink-0">
          <span className="font-medium">
            Source: <strong>Raw Stadia | US Soccer — Playing Surface Indexes (Impact, Energy, Grip)</strong>. Tissue tags represent suggested considerations, not deterministic thresholds.
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
