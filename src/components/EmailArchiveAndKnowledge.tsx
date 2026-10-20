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
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="pb-3 mb-4 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              Ingested Superhuman Reports ({INGESTED_EMAIL_REPORTS.length})
            </h3>
            <p className="text-xs text-slate-400">
              All Sept/Oct 2026 Camp Surface Intelligence reports sent by{' '}
              <strong>José María Oliva Lozano</strong> &amp; <strong>Jordan Webb</strong>
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
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/15 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-emerald-400 font-bold">{em.date}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-sans font-semibold">
                      {em.sessionObjective}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white leading-snug">{em.subject}</div>
                  <div className="text-xs text-slate-400 mt-1 truncate">{em.from}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-mono">
                    <Paperclip className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{em.attachmentName}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right 7 Columns: Selected Email Detail, Structured Takeaways & Rendered HTML */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {activeEmail.reportCategory}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{activeEmail.sentAt}</span>
                </div>
                <h3 className="text-xl font-extrabold text-white mt-1">{activeEmail.subject}</h3>
                <p className="text-xs text-slate-400 mt-0.5">From: {activeEmail.from}</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>{activeEmail.attachmentName}</span>
              </div>
            </div>

            {/* Recommended Pitch Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 mb-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Staff Operational Decision / Recommendation
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {activeEmail.recommendedPitch}
              </div>
            </div>

            {/* Extracted Metrics Table */}
            <div className="mb-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Extracted Surface Metrics in Report
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {activeEmail.metricsSummary.map((ms) => (
                  <div
                    key={ms.pitch}
                    className="bg-slate-950/90 border border-slate-800 rounded-xl p-3"
                  >
                    <div className="text-xs font-bold text-white mb-2">{ms.pitch}</div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Impact:</span>
                        <strong className="text-emerald-300">{ms.impact}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Energy:</span>
                        <strong className="text-teal-300">{ms.energy}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Grip:</span>
                        <strong className="text-violet-300">{ms.grip}</strong>
                      </div>
                      {ms.bootNote && (
                        <div className="pt-1 mt-1 border-t border-slate-800 text-[11px] text-amber-300 font-sans font-semibold">
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
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Executive Summary &amp; Clinical Notes
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-200 list-disc list-inside bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
                {activeEmail.keyTakeaways.map((kt, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {kt}
                  </li>
                ))}
              </ul>
            </div>

            {/* Rendered HTML Email Body */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Ingested Superhuman Email Body (HTML)
              </h4>
              <div
                className="bg-white text-slate-900 rounded-xl p-5 text-sm shadow-inner prose max-w-none"
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
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Raw Stadia × US Soccer Surface Intelligence Encyclopedia
            </h3>
            <p className="text-xs text-slate-400">
              Synthesized from your Obsidian Vault (<code>Raw Stadia _ US Soccer - Indexes.pdf</code>
              ), RAA/RTT biomechanical documentation, and reverse-engineered CSV equations
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {RAW_STADIA_KNOWLEDGE_SPECS.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setSelectedIndexName(s.name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  activeSpec.name === s.name
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Active Index Deep-Dive Card (Reproducing the Obsidian PDF Low vs High Field Columns!) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-5 bg-slate-950/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {activeSpec.category}
                </span>
                <span className="text-xs font-mono text-slate-400">{activeSpec.hardwareTester}</span>
              </div>

              <h4 className="text-3xl font-black text-white tracking-tight mt-1">
                {activeSpec.name.toUpperCase()}
              </h4>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">
                {activeSpec.shortLabel} • {activeSpec.unitOrScale}
              </p>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                {activeSpec.description}
              </p>

              <blockquote className="mt-4 p-3.5 rounded-xl bg-emerald-950/40 border-l-4 border-emerald-400 text-xs italic text-emerald-100 leading-relaxed">
                “{activeSpec.quote}”
              </blockquote>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Mathematical Formula &amp; Mechanical Drivers
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-xs text-violet-300 mb-2">
                {activeSpec.formulaDisplay}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activeSpec.mechanicalProperties.map((mp) => (
                  <span
                    key={mp}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
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
              { side: activeSpec.lowSpectrum, theme: 'sky' },
              { side: activeSpec.highSpectrum, theme: 'emerald' },
            ].map(({ side, theme }) => (
              <div
                key={side.title}
                className={`rounded-2xl border p-5 flex flex-col justify-between ${
                  theme === 'sky'
                    ? 'bg-sky-950/25 border-sky-500/30'
                    : 'bg-emerald-950/25 border-emerald-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-extrabold uppercase tracking-wider ${
                        theme === 'sky' ? 'text-sky-300' : 'text-emerald-300'
                      }`}
                    >
                      {side.title}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{side.rangeLabel}</span>
                  </div>

                  <div className="space-y-3 mt-4 text-xs">
                    <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Load Impact
                      </span>
                      <strong className="text-white text-sm">
                        {side.mechanicalOrPhysiologicalLoad}
                      </strong>
                    </div>

                    <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Player Feel
                      </span>
                      <strong className="text-white text-sm">{side.surfaceFeel}</strong>
                    </div>

                    <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Used For (Periodization)
                      </span>
                      <strong className="text-emerald-300 text-sm">{side.recommendedUse}</strong>
                    </div>

                    <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Primary Injury Risk Focus
                      </span>
                      <strong className="text-rose-300 text-sm">{side.injuryRiskFocus}</strong>
                    </div>

                    <div className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Tactical Use
                      </span>
                      <strong className="text-amber-300 text-sm">{side.tacticalUse}</strong>
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
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h4 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Microscope className="w-5 h-5 text-emerald-400" />
            Raw Stadia Hardware Instrumentation (RAA &amp; RTT)
          </h4>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
              <div className="font-bold text-emerald-300 text-sm mb-1">
                1. Raw Artificial Athlete (RAA) — Vertical Impact &amp; Energy
              </div>
              <p className="leading-relaxed">
                Non-destructive mechanical drop test simulating a player’s heel/forefoot strike on
                the pitch across all 18 zones. Directly measures{' '}
                <strong>Hardness (Gm)</strong>, <strong>Shock Absorption (%)</strong>,{' '}
                <strong>Energy Restitution (%)</strong>, and{' '}
                <strong>Vertical Deformation (mm)</strong>. Because it does not tear turf, RAA is
                executed daily at NTC and on Stadium Match Days.
              </p>
            </div>
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
              <div className="font-bold text-violet-300 text-sm mb-1">
                2. Rotational Traction Tester (RTT) — Shear Grip &amp; Boot Index
              </div>
              <p className="leading-relaxed">
                Uses studded footplates under vertical load to replicate an athlete planting and
                cutting. Quantifies <strong>Rotational Resistance / Peak Torque (Nm)</strong>,{' '}
                <strong>Stud Penetration Depth (mm)</strong>, <strong>Initial Grip</strong>, and{' '}
                <strong>Rotational Stiffness</strong>. Generates the 0–10 <strong>Grip</strong> and{' '}
                <strong>Boot</strong> indices.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h4 className="text-base font-bold text-white flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-violet-400" />
            Exact Training Goal Mathematical Engine (Verified to 10⁻⁹)
          </h4>
          <p className="text-xs text-slate-400 mb-3">
            Reverse-engineered from the 3,712 CSV zone records: every Training Goal score is an
            exact linear combination of <strong>Impact (I)</strong>, <strong>Energy (E)</strong>,
            and <strong>Grip (G)</strong>:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-xs">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="text-emerald-400 font-bold block">Speed</span>
              <span className="text-slate-200">0.5·I + 0.5·E + 0.75</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="text-sky-400 font-bold block">Endurance (12 − Speed)</span>
              <span className="text-slate-200">11.25 − 0.5·I − 0.5·E</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="text-teal-400 font-bold block">Recovery</span>
              <span className="text-slate-200">5.75 + 0.5·(E − I)</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="text-amber-400 font-bold block">Power</span>
              <span className="text-slate-200">0.5·I + 0.5·G + 0.50</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="text-violet-400 font-bold block">Reaction</span>
              <span className="text-slate-200">(I + E + G)/3 + 0.50</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="text-rose-400 font-bold block">Metabolic (12 − Reaction)</span>
              <span className="text-slate-200">11.50 − (I + E + G)/3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Addition 2 — Appendix A Surface Characteristic Definitions (Jordan's Sept 26 Mockup media_6.png) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              Appendix A — Surface Characteristic &amp; Physical Metric Definitions
            </h3>
            <p className="text-xs text-slate-400">
              Standardized glossary requested for USMNT Match Day &amp; Training Surface Reports
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
            <ShieldAlert className="w-4 h-4" /> FIFA / Raw Stadia Benchmarks Included
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {APPENDIX_A_DEFINITIONS.map((item) => (
            <div
              key={item.term}
              className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-sm font-extrabold text-white">{item.term}</h4>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Optimal: {item.optimalBand}
                </span>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                Instrument: {item.instrument}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.definition}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
