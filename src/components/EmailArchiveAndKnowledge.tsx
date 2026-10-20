import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  FileText,
  Mail,
  Microscope,
  Paperclip,
  Scale,
  ShieldAlert,
} from 'lucide-react';
import {
  APPENDIX_A_DEFINITIONS,
  INGESTED_EMAIL_REPORTS,
  RAW_STADIA_KNOWLEDGE_SPECS,
} from '../data/rawStadiaKnowledge';

interface EmailArchiveAndKnowledgeProps {
  mode: 'emails' | 'knowledge';
}

export const EmailArchiveAndKnowledge: React.FC<EmailArchiveAndKnowledgeProps> = ({ mode }) => {
  const [selectedEmailId, setSelectedEmailId] = useState<string>(INGESTED_EMAIL_REPORTS[0].id);
  const [selectedIndexName, setSelectedIndexName] = useState<string>('Impact');

  const activeEmail =
    INGESTED_EMAIL_REPORTS.find((e) => e.id === selectedEmailId) || INGESTED_EMAIL_REPORTS[0];
  const activeSpec =
    RAW_STADIA_KNOWLEDGE_SPECS.find((s) => s.name === selectedIndexName) ||
    RAW_STADIA_KNOWLEDGE_SPECS[0];

  if (mode === 'emails') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Columns: Ingested Superhuman Emails List */}
        <div
          className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-[10px] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="pb-3 mb-4 border-b border-[#E5E9F0]">
            <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#C69214]" />
              Ingested Superhuman Reports ({INGESTED_EMAIL_REPORTS.length})
            </h3>
            <p className="text-xs text-[#64748B] font-medium">
              All Sept/Oct 2026 Camp Surface Intelligence reports sent by{' '}
              <strong className="text-[#2E3440]">José María Oliva Lozano</strong> &amp;{' '}
              <strong className="text-[#2E3440]">Jordan Webb</strong>
            </p>
          </div>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {INGESTED_EMAIL_REPORTS.map((em) => {
              const isSelected = em.id === activeEmail.id;
              return (
                <button
                  key={em.id}
                  type="button"
                  onClick={() => setSelectedEmailId(em.id)}
                  className={`w-full text-left p-3.5 rounded-[8px] border transition-all ${
                    isSelected
                      ? 'bg-[#EFF6FF] border-[1.5px] border-[#001489] border-l-[4px] border-l-[#C69214] shadow-sm'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#C69214]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-[#001489] font-extrabold">{em.date}</span>
                    <span className="px-2 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#434C5E] font-sans font-bold">
                      {em.sessionObjective}
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-[#2E3440] leading-snug">{em.subject}</div>
                  <div className="text-xs text-[#64748B] font-medium mt-1 truncate">{em.from}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] mt-2 font-mono font-semibold">
                    <Paperclip className="w-3 h-3 text-[#C69214] shrink-0" />
                    <span className="truncate">{em.attachmentName}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 7 Columns: Selected Email Detail, Structured Takeaways & Rendered HTML */}
        <div
          className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-[10px] p-6 flex flex-col justify-between"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 mb-5 border-b border-[#E5E9F0]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-[0.06em] px-2.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                    {activeEmail.reportCategory}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#64748B]">{activeEmail.sentAt}</span>
                </div>
                <h3 className="text-xl font-black text-[#2E3440] mt-1">{activeEmail.subject}</h3>
                <p className="text-xs text-[#64748B] font-semibold mt-0.5">From: {activeEmail.from}</p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[8px] px-3 py-2 text-xs font-mono font-bold text-[#2E3440] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#C69214]" />
                <span>{activeEmail.attachmentName}</span>
              </div>
            </div>

            {/* Recommended Pitch Banner */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] border-l-[4px] border-l-[#001489] rounded-[8px] p-3.5 mb-5">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#001489]">
                Staff Operational Decision / Recommendation
              </div>
              <div className="text-sm font-extrabold text-[#2E3440] mt-0.5">
                {activeEmail.recommendedPitch}
              </div>
            </div>

            {/* Extracted Metrics Table */}
            <div className="mb-5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] mb-2">
                Extracted Surface Metrics in Report
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeEmail.metricsSummary.map((ms) => (
                  <div
                    key={ms.pitch}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3"
                  >
                    <div className="text-xs font-extrabold text-[#2E3440] mb-2">{ms.pitch}</div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-[#64748B] font-sans font-bold">Impact:</span>
                        <strong className="text-[#001489]">{ms.impact}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] font-sans font-bold">Energy:</span>
                        <strong className="text-emerald-700">{ms.energy}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B] font-sans font-bold">Grip:</span>
                        <strong className="text-purple-700">{ms.grip}</strong>
                      </div>
                      {ms.bootNote && (
                        <div className="pt-1 mt-1 border-t border-[#E2E8F0] text-[11px] text-[#92400E] font-sans font-bold">
                          {ms.bootNote}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="mb-5">
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] mb-2">
                Executive Summary &amp; Clinical Notes
              </h4>
              <ul className="space-y-1.5 text-xs text-[#2E3440] font-medium list-disc list-inside bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3.5">
                {activeEmail.keyTakeaways.map((kt, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {kt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Rendered HTML Email Body */}
            <div>
              <h4 className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] mb-2">
                Ingested Superhuman Email Body (HTML)
              </h4>
              <div
                className="bg-white border border-[#CBD5E1] text-[#1E293B] rounded-[8px] p-5 text-sm shadow-sm prose max-w-none"
                dangerouslySetInnerHTML={{ __html: activeEmail.rawHtml }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Knowledge Base Mode (Obsidian PDF + Hardware Testers + Closed-Form Equations + Jordan's Appendix A)
  return (
    <div className="space-y-6">
      {/* Section 1: Interactive Obsidian PDF Explorer (USSF x Raw Stadia Index Spectrums) */}
      <div
        className="bg-white border border-[#E2E8F0] rounded-[10px] p-6"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E5E9F0]">
          <div>
            <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#C69214]" />
              Raw Stadia × US Soccer Surface Intelligence Encyclopedia
            </h3>
            <p className="text-xs text-[#64748B] font-medium">
              Synthesized from your Obsidian Vault (<code className="text-[#001489]">Raw Stadia _ US Soccer - Indexes.pdf</code>
              ), RAA/RTT biomechanical documentation, and reverse-engineered CSV equations
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {RAW_STADIA_KNOWLEDGE_SPECS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setSelectedIndexName(s.name)}
                className={`px-3 py-1.5 rounded-[7px] text-xs border transition-all ${
                  activeSpec.name === s.name
                    ? 'bg-[#001489] text-white border-[#C69214] font-extrabold shadow-sm'
                    : 'bg-[#F8F9FA] text-[#434C5E] border-[#CBD5E1] font-semibold hover:border-[#C69214]'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active Index Deep-Dive Card (Reproducing the Obsidian PDF Low vs High Field Columns!) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-[0.06em] px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#001489] border border-[#BFDBFE]">
                  {activeSpec.category}
                </span>
                <span className="text-xs font-mono font-bold text-[#64748B]">{activeSpec.hardwareTester}</span>
              </div>

              <h4 className="text-3xl font-black text-[#2E3440] tracking-tight mt-1">
                {activeSpec.name.toUpperCase()}
              </h4>
              <p className="text-xs font-extrabold text-[#C69214] mt-0.5">
                {activeSpec.shortLabel} • {activeSpec.unitOrScale}
              </p>

              <p className="text-xs text-[#434C5E] font-medium mt-3 leading-relaxed">
                {activeSpec.description}
              </p>

              <blockquote className="mt-4 p-3.5 rounded-[8px] bg-[#FEF3C7]/45 border-l-4 border-[#C69214] text-xs italic text-[#2E3440] font-semibold leading-relaxed">
                “{activeSpec.quote}”
              </blockquote>
            </div>

            <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] mb-1.5">
                Mathematical Formula &amp; Mechanical Drivers
              </div>
              <div className="bg-white border border-[#CBD5E1] rounded-[7px] p-2.5 font-mono text-xs font-bold text-[#001489] mb-2">
                {activeSpec.formulaDisplay}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeSpec.mechanicalProperties.map((mp) => (
                  <span
                    key={mp}
                    className="text-[11px] font-bold px-2 py-0.5 rounded bg-white border border-[#CBD5E1] text-[#434C5E]"
                  >
                    {mp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right 7 Columns: Side-by-Side Low Spectrum vs High Spectrum (Exact match to Obsidian PDF!) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { side: activeSpec.lowSpectrum, theme: 'navy' },
              { side: activeSpec.highSpectrum, theme: 'emerald' },
            ].map(({ side, theme }) => (
              <div
                key={side.title}
                className={`rounded-[10px] border p-5 flex flex-col justify-between ${
                  theme === 'navy'
                    ? 'bg-[#EFF6FF]/60 border-[#BFDBFE]'
                    : 'bg-emerald-50/70 border-emerald-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-black uppercase tracking-[0.06em] ${
                        theme === 'navy' ? 'text-[#001489]' : 'text-emerald-800'
                      }`}
                    >
                      {side.title}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#64748B]">{side.rangeLabel}</span>
                  </div>

                  <div className="space-y-2.5 mt-3 text-xs">
                    <div className="bg-white rounded-[8px] p-2.5 border border-[#E2E8F0]">
                      <span className="text-[10px] font-extrabold uppercase text-[#64748B] block">
                        Load Impact
                      </span>
                      <strong className="text-[#2E3440] text-sm">
                        {side.mechanicalOrPhysiologicalLoad}
                      </strong>
                    </div>

                    <div className="bg-white rounded-[8px] p-2.5 border border-[#E2E8F0]">
                      <span className="text-[10px] font-extrabold uppercase text-[#64748B] block">
                        Player Feel
                      </span>
                      <strong className="text-[#2E3440] text-sm">{side.surfaceFeel}</strong>
                    </div>

                    <div className="bg-white rounded-[8px] p-2.5 border border-[#E2E8F0]">
                      <span className="text-[10px] font-extrabold uppercase text-[#64748B] block">
                        Used For (Periodization)
                      </span>
                      <strong className="text-emerald-800 text-sm">{side.recommendedUse}</strong>
                    </div>

                    <div className="bg-white rounded-[8px] p-2.5 border border-[#E2E8F0]">
                      <span className="text-[10px] font-extrabold uppercase text-[#64748B] block">
                        Primary Injury Risk Focus
                      </span>
                      <strong className="text-[#DA291C] text-sm">{side.injuryRiskFocus}</strong>
                    </div>

                    <div className="bg-white rounded-[8px] p-2.5 border border-[#E2E8F0]">
                      <span className="text-[10px] font-extrabold uppercase text-[#64748B] block">
                        Tactical Use
                      </span>
                      <strong className="text-[#001489] text-sm">{side.tacticalUse}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Hardware Instrumentation & Closed-Form Formula Reference */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div
          className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-[10px] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <h4 className="text-base font-extrabold text-[#2E3440] flex items-center gap-2 mb-3">
            <Microscope className="w-5 h-5 text-[#C69214]" />
            Raw Stadia Hardware Instrumentation (RAA &amp; RTT)
          </h4>
          <div className="space-y-3 text-xs text-[#434C5E] font-medium">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3.5">
              <div className="font-extrabold text-[#001489] text-sm mb-1">
                1. Raw Artificial Athlete (RAA) — Vertical Impact &amp; Energy
              </div>
              <p className="leading-relaxed">
                Non-destructive mechanical drop test simulating a player’s heel/forefoot strike on
                the pitch across all 18 zones. Directly measures{' '}
                <strong className="text-[#2E3440]">Hardness (Gm)</strong>,{' '}
                <strong className="text-[#2E3440]">Shock Absorption (%)</strong>,{' '}
                <strong className="text-[#2E3440]">Energy Restitution (%)</strong>, and{' '}
                <strong className="text-[#2E3440]">Vertical Deformation (mm)</strong>. Because it does not tear turf, RAA is
                executed daily at NTC and on Stadium Match Days.
              </p>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3.5">
              <div className="font-extrabold text-[#92400E] text-sm mb-1">
                2. Rotational Traction Tester (RTT) — Shear Grip &amp; Boot Index
              </div>
              <p className="leading-relaxed">
                Uses studded footplates under vertical load to replicate an athlete planting and
                cutting. Quantifies <strong className="text-[#2E3440]">Rotational Resistance / Peak Torque (Nm)</strong>,{' '}
                <strong className="text-[#2E3440]">Stud Penetration Depth (mm)</strong>,{' '}
                <strong className="text-[#2E3440]">Initial Grip</strong>, and{' '}
                <strong className="text-[#2E3440]">Rotational Stiffness</strong>. Generates the 0–10{' '}
                <strong className="text-[#2E3440]">Grip</strong> and{' '}
                <strong className="text-[#2E3440]">Boot</strong> indices.
              </p>
            </div>
          </div>
        </div>

        <div
          className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-[10px] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <h4 className="text-base font-extrabold text-[#2E3440] flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-[#C69214]" />
            Exact Training Goal Mathematical Engine (Verified to 10⁻⁹)
          </h4>
          <p className="text-xs text-[#64748B] font-medium mb-3">
            Reverse-engineered from the 3,712 CSV zone records: every Training Goal score is an
            exact linear combination of <strong className="text-[#2E3440]">Impact (I)</strong>,{' '}
            <strong className="text-[#2E3440]">Energy (E)</strong>, and{' '}
            <strong className="text-[#2E3440]">Grip (G)</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5">
              <span className="text-[#001489] font-extrabold font-sans block">Speed</span>
              <span className="text-[#2E3440] font-bold">0.5·I + 0.5·E + 0.75</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5">
              <span className="text-[#001489] font-extrabold font-sans block">Endurance (12 − Speed)</span>
              <span className="text-[#2E3440] font-bold">11.25 − 0.5·I − 0.5·E</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5">
              <span className="text-emerald-700 font-extrabold font-sans block">Recovery</span>
              <span className="text-[#2E3440] font-bold">5.75 + 0.5·(E − I)</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5">
              <span className="text-[#92400E] font-extrabold font-sans block">Power</span>
              <span className="text-[#2E3440] font-bold">0.5·I + 0.5·G + 0.50</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5">
              <span className="text-purple-700 font-extrabold font-sans block">Reaction</span>
              <span className="text-[#2E3440] font-bold">(I + E + G)/3 + 0.50</span>
            </div>
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5">
              <span className="text-[#DA291C] font-extrabold font-sans block">Metabolic (12 − Reaction)</span>
              <span className="text-[#2E3440] font-bold">11.50 − (I + E + G)/3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Addition 2 — Appendix A Surface Characteristic Definitions (Jordan's Sept 26 Mockup media_6.png) */}
      <div
        className="bg-white border border-[#E2E8F0] rounded-[10px] p-6"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#E5E9F0]">
          <div>
            <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#C69214]" />
              Appendix A — Surface Characteristic &amp; Physical Metric Definitions
            </h3>
            <p className="text-xs text-[#64748B] font-medium">
              Standardized glossary requested for USMNT Match Day &amp; Training Surface Reports
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> FIFA / Raw Stadia Benchmarks Included
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {APPENDIX_A_DEFINITIONS.map((item) => (
            <div
              key={item.term}
              className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-4 hover:border-[#C69214] transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-black text-[#2E3440]">{item.term}</h4>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                  Optimal: {item.optimalBand}
                </span>
              </div>
              <div className="text-[10px] font-mono font-bold uppercase tracking-[0.06em] text-[#C69214] mb-1.5">
                Instrument: {item.instrument}
              </div>
              <p className="text-xs text-[#434C5E] font-medium leading-relaxed">{item.definition}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
