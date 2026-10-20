import React from 'react';
import { getKnowledgeSpec } from '../data/rawStadiaKnowledge';
import { IndexName, PitchEvaluation, ReferenceBaselineProfile } from '../types/rawStadia';
import { CORE_INDEX_NAMES, getMagnitudeAssessment } from '../utils/rawStadiaEngine';
import { MetricInfoTrigger } from './AppendixAModal';

interface HeadToHeadVisualComparisonProps {
  primaryEval: PitchEvaluation;
  compareEval: PitchEvaluation;
  referenceProfile: ReferenceBaselineProfile;
  onOpenSpatialMap?: () => void;
  onOpenAppendixA?: (metricKey: IndexName) => void;
}

export const HeadToHeadVisualComparison: React.FC<HeadToHeadVisualComparisonProps> = ({
  primaryEval,
  compareEval,
  referenceProfile,
  onOpenAppendixA,
}) => {
  // Compute overall 3-metric Surface Similarity Score (0-100%)
  const meanAbsDiff =
    CORE_INDEX_NAMES.reduce(
      (acc, m) => acc + Math.abs(primaryEval.averages[m] - compareEval.averages[m]),
      0
    ) / 3;
  const similarityScore = Math.max(0, Math.min(100, Math.round((1 - meanAbsDiff / 4.5) * 100)));

  // 3-Axis Triad Radar SVG Geometry (Impact at Top, Energy at Bottom-Right, Grip at Bottom-Left)
  const size = 340;
  const cx = size / 2;
  const cy = size / 2 + 18;
  const maxR = 112;
  const levels = [2, 4, 6, 8, 10];

  const getAngle = (idx: number) => -Math.PI / 2 + (idx * 2 * Math.PI) / 3;

  const getPoint = (idx: number, val: number) => {
    const r = (Math.max(0, Math.min(10, val)) / 10) * maxR;
    const angle = getAngle(idx);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const buildPolygonPoints = (evalMap: Record<IndexName, number>) =>
    CORE_INDEX_NAMES.map((m, idx) => {
      const pt = getPoint(idx, evalMap[m]);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');

  const refMap: Record<IndexName, number> = {
    Impact: referenceProfile.metrics.Impact.mean,
    Energy: referenceProfile.metrics.Energy.mean,
    Grip: referenceProfile.metrics.Grip.mean,
  };

  const primaryPoly = buildPolygonPoints(primaryEval.averages);
  const comparePoly = buildPolygonPoints(compareEval.averages);
  const refPoly = buildPolygonPoints(refMap);

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5E9F0]">
        <div>
          <h3 className="text-base font-extrabold text-[#2E3440]">
            Head-to-Head Surface Triad Comparison (Impact • Energy • Grip)
          </h3>
          <p className="text-xs text-[#64748B] font-medium">
            3-axis surface profile &amp; dual horizontal bars comparing{' '}
            <strong className="text-[#001489]">Pitch A (Mean ± SD)</strong> vs.{' '}
            <strong className="text-[#C69214]">Pitch B (Mean ± SD)</strong> against the{' '}
            <strong className="text-emerald-700">
              {referenceProfile.shortLabel} Reference Range
            </strong>
          </p>
        </div>

        {/* Legend & Similarity Pill */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 font-extrabold text-[#001489]">
            <span className="w-3 h-3 rounded-sm bg-[#001489] inline-block" />
            Pitch A: {primaryEval.pitchName} ({primaryEval.date.slice(5)})
          </span>
          <span className="flex items-center gap-1.5 font-extrabold text-[#92400E]">
            <span className="w-3 h-3 rounded-sm bg-[#C69214] inline-block" />
            Pitch B: {compareEval.pitchName} ({compareEval.date.slice(5)})
          </span>
          <span className="flex items-center gap-1.5 font-extrabold text-purple-800">
            <span className="w-3 h-0.5 bg-purple-600 inline-block" />
            REF ({referenceProfile.shortLabel})
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-extrabold bg-[#EFF6FF] text-[#001489] border border-[#BFDBFE]">
            Triad Match: {similarityScore}%
          </span>
        </div>
      </div>

      {/* 12-Column Layout: Left 5 Cols = 3-Axis Triad Radar + Summary Table | Right 7 Cols = 3 Detailed Visual Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 5 Columns: 3-Axis Surface Triad Radar + Mean ± SD Table */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4">
          <div className="flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#64748B]">
                3-Axis Triad Overlay (0–10 Scale)
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-800">
                Ref: {referenceProfile.shortLabel}
              </span>
            </div>

            <svg viewBox={`0 0 ${size} ${size - 25}`} className="w-full max-w-[320px] h-auto">
              {/* Concentric Triangle Grid Rings */}
              {levels.map((lvl) => {
                const pts = CORE_INDEX_NAMES.map((_, idx) => {
                  const p = getPoint(idx, lvl);
                  return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
                }).join(' ');
                return (
                  <g key={lvl}>
                    <polygon
                      points={pts}
                      fill="none"
                      stroke={lvl === 6 ? '#94A3B8' : '#CBD5E1'}
                      strokeDasharray={lvl === 6 ? '3 3' : undefined}
                      strokeWidth={lvl === 6 ? '1.3' : '0.9'}
                    />
                    <text
                      x={cx + 5}
                      y={cy - (lvl / 10) * maxR + 3}
                      className="fill-[#64748B] text-[9px] font-mono font-bold"
                    >
                      {lvl}
                    </text>
                  </g>
                );
              })}

              {/* Axis Spokes & Labels */}
              {CORE_INDEX_NAMES.map((m, idx) => {
                const outer = getPoint(idx, 10);
                const labelPt = getPoint(idx, 12.0);
                return (
                  <g key={m}>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="#CBD5E1"
                      strokeWidth="1.2"
                    />
                    <text
                      x={labelPt.x}
                      y={labelPt.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-[#001489] text-[12px] font-black uppercase tracking-wider"
                    >
                      {m}
                    </text>
                  </g>
                );
              })}

              {/* Purple REF Baseline Triangle */}
              <polygon
                points={refPoly}
                fill="rgba(124, 58, 237, 0.08)"
                stroke="#7C3AED"
                strokeWidth="2"
                strokeDasharray="5 3"
              />

              {/* Compare Pitch B Polygon (Gold) */}
              <polygon
                points={comparePoly}
                fill="rgba(198, 146, 20, 0.22)"
                stroke="#C69214"
                strokeWidth="2.5"
              />

              {/* Primary Pitch A Polygon (Navy) */}
              <polygon
                points={primaryPoly}
                fill="rgba(0, 20, 137, 0.22)"
                stroke="#001489"
                strokeWidth="2.8"
              />

              {/* Data Nodes */}
              {CORE_INDEX_NAMES.map((m, idx) => {
                const pA = getPoint(idx, primaryEval.averages[m]);
                const pB = getPoint(idx, compareEval.averages[m]);
                const pR = getPoint(idx, refMap[m]);
                return (
                  <g key={`nodes-${m}`}>
                    <circle
                      cx={pR.x}
                      cy={pR.y}
                      r="3.5"
                      fill="#7C3AED"
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                    <circle
                      cx={pB.x}
                      cy={pB.y}
                      r="4.5"
                      fill="#C69214"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx={pA.x}
                      cy={pA.y}
                      r="5"
                      fill="#001489"
                      stroke="#FFFFFF"
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Compact Mean ± 1 SD Comparison Table under Triangle */}
          <div className="mt-2 pt-3 border-t border-[#E2E8F0]">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-[10px] font-sans font-extrabold uppercase text-[#64748B] border-b border-[#E2E8F0]">
                  <th className="py-1 text-left">Metric</th>
                  <th className="py-1 text-right text-[#001489]">Pitch A (±SD)</th>
                  <th className="py-1 text-right text-[#92400E]">Pitch B (±SD)</th>
                  <th className="py-1 text-right text-purple-800">REF Band</th>
                </tr>
              </thead>
              <tbody>
                {CORE_INDEX_NAMES.map((m) => {
                  const stA = primaryEval.stats[m];
                  const stB = compareEval.stats[m];
                  const refSt = referenceProfile.metrics[m];
                  return (
                    <tr key={m} className="border-b border-[#E2E8F0]/60 last:border-0">
                      <td className="py-1.5 font-sans font-extrabold text-[#2E3440]">{m}</td>
                      <td className="py-1.5 text-right font-black text-[#001489]">
                        {stA.mean.toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-[#64748B]">
                          ±{stA.sd.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-1.5 text-right font-black text-[#92400E]">
                        {stB.mean.toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-[#64748B]">
                          ±{stB.sd.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-1.5 text-right text-[11px] font-bold text-emerald-800">
                        {refSt.bandMin.toFixed(2)}–{refSt.bandMax.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 7 Columns: 3 Visual Dual-Bar & Spectrum Comparison Cards (Impact, Energy, Grip) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-3.5">
          {CORE_INDEX_NAMES.map((metric) => {
            const spec = getKnowledgeSpec(metric);
            const stA = primaryEval.stats[metric];
            const stB = compareEval.stats[metric];
            const refSt = referenceProfile.metrics[metric];
            const magAB = getMagnitudeAssessment(metric, stA.mean, stB.mean, refSt.sd);

            const pctA = Math.max(0, Math.min(100, (stA.mean / 10) * 100));
            const pctB = Math.max(0, Math.min(100, (stB.mean / 10) * 100));
            const pctRef = Math.max(0, Math.min(100, (refSt.mean / 10) * 100));
            const bandLeft = (refSt.bandMin / 10) * 100;
            const bandWidth = Math.max(2, ((refSt.bandMax - refSt.bandMin) / 10) * 100);

            return (
              <div
                key={metric}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4 flex flex-col justify-between hover:border-[#C69214] transition-all"
              >
                {/* Top Row: Metric Title + Spectrum Poles + Effect Size Magnitude Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase tracking-[0.06em] text-[#001489]">
                      {metric}
                    </span>
                    <span className="text-xs font-bold text-[#434C5E]">
                      ({spec.lowSpectrum.title} ↔ {spec.highSpectrum.title})
                    </span>
                    {onOpenAppendixA && (
                      <MetricInfoTrigger metricKey={metric} onOpenModal={onOpenAppendixA} />
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-mono font-extrabold px-2.5 py-0.5 rounded border ${magAB.badgeClass}`}
                  >
                    A vs B: {magAB.summaryText}
                  </span>
                </div>

                {/* Middle Row: Dual Horizontal Bars (Pitch A Navy & Pitch B Gold) + Shaded Green Reference Band + Purple REF Line */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center my-1">
                  {/* Left Numeric Readout */}
                  <div className="sm:col-span-4 flex items-center justify-between sm:justify-start gap-3 font-mono text-xs">
                    <div className="bg-white border border-[#BFDBFE] border-l-[3px] border-l-[#001489] rounded px-2.5 py-1">
                      <span className="text-[9px] font-sans font-extrabold uppercase text-[#001489] block">
                        Pitch A (Mean ± SD)
                      </span>
                      <strong className="text-sm font-black text-[#2E3440]">
                        {stA.mean.toFixed(2)} ± {stA.sd.toFixed(2)}
                      </strong>
                    </div>
                    <div className="bg-white border border-[#FDE68A] border-l-[3px] border-l-[#C69214] rounded px-2.5 py-1">
                      <span className="text-[9px] font-sans font-extrabold uppercase text-[#92400E] block">
                        Pitch B (Mean ± SD)
                      </span>
                      <strong className="text-sm font-black text-[#2E3440]">
                        {stB.mean.toFixed(2)} ± {stB.sd.toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  {/* Right Dual Visual Track (0-10) */}
                  <div className="sm:col-span-8">
                    <div className="flex justify-between text-[9.5px] font-mono font-bold text-[#64748B] mb-1">
                      <span>0.0 • {spec.lowSpectrum.title}</span>
                      <span className="text-emerald-800 font-sans font-extrabold">
                        Ref Band: {refSt.bandMin.toFixed(2)}–{refSt.bandMax.toFixed(2)} (REF{' '}
                        {refSt.mean.toFixed(2)})
                      </span>
                      <span>10.0 • {spec.highSpectrum.title}</span>
                    </div>

                    <div className="relative h-8 rounded-[7px] bg-[#E2E8F0] overflow-visible p-1 flex flex-col justify-between">
                      {/* Shaded Green Reference Range Band */}
                      <div
                        className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-600/60 pointer-events-none"
                        style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
                      />

                      {/* Purple Vertical REF Line */}
                      <div
                        className="absolute -top-1 -bottom-1 w-[2px] bg-purple-600 z-20"
                        style={{ left: `${pctRef}%` }}
                        title={`REF: ${refSt.mean.toFixed(2)}`}
                      />

                      {/* Pitch A Bar (Top Track) */}
                      <div className="relative h-2.5 w-full rounded-sm overflow-hidden z-10">
                        <div
                          className="h-full bg-[#001489] rounded-r-sm transition-all duration-300"
                          style={{ width: `${pctA}%` }}
                        />
                      </div>

                      {/* Pitch B Bar (Bottom Track) */}
                      <div className="relative h-2.5 w-full rounded-sm overflow-hidden z-10">
                        <div
                          className="h-full bg-[#C69214] rounded-r-sm transition-all duration-300"
                          style={{ width: `${pctB}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: PDF Spectrum Guidance & Clinical Note */}
                <div className="mt-2.5 pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-[#434C5E] font-semibold">{magAB.clinicalNote}</span>
                  <span className="font-mono text-[10px] text-[#64748B]">
                    18-Zone Min–Max: <strong className="text-[#001489]">A ({stA.min.toFixed(1)}–{stA.max.toFixed(1)})</strong> •{' '}
                    <strong className="text-[#92400E]">B ({stB.min.toFixed(1)}–{stB.max.toFixed(1)})</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
