import React from 'react';
import { Sparkles } from 'lucide-react';
import { PitchEvaluation } from '../types/rawStadia';
import { getBootRecommendation, getMagnitudeAssessment } from '../utils/rawStadiaEngine';
import { MetricInfoTrigger } from './AppendixAModal';

interface HeadToHeadVisualComparisonProps {
  primaryEval: PitchEvaluation;
  compareEval: PitchEvaluation;
  refBaseline: PitchEvaluation;
  onOpenSpatialMap: () => void;
  onOpenAppendixA: (metricKey: string) => void;
}

interface HardwareMetricSpec {
  key: string;
  shortAxisLabel: string;
  label: string;
  instrument: string;
  pVal: number;
  cVal: number;
  rVal: number;
  unit: string;
  scaleMin: number;
  scaleMax: number;
  optMin: number;
  optMax: number;
  optLabel: string;
  extraNote?: string;
}

export const HeadToHeadVisualComparison: React.FC<HeadToHeadVisualComparisonProps> = ({
  primaryEval,
  compareEval,
  refBaseline,
  onOpenSpatialMap,
  onOpenAppendixA,
}) => {
  const primaryBoot = getBootRecommendation(
    primaryEval.averages.Boot,
    primaryEval.hardwareMetrics.studDepthMm,
    primaryEval.averages.Grip
  );
  const compareBoot = getBootRecommendation(
    compareEval.averages.Boot,
    compareEval.hardwareMetrics.studDepthMm,
    compareEval.averages.Grip
  );

  const metrics: HardwareMetricSpec[] = [
    {
      key: 'Hardness',
      shortAxisLabel: 'Hardness',
      label: 'Surface Hardness',
      instrument: 'RAA • Opt: 65–85 Gm',
      pVal: primaryEval.hardwareMetrics.hardnessGm,
      cVal: compareEval.hardwareMetrics.hardnessGm,
      rVal: refBaseline.hardwareMetrics.hardnessGm,
      unit: 'Gm',
      scaleMin: 50,
      scaleMax: 105,
      optMin: 65,
      optMax: 85,
      optLabel: '65–85 Gm',
    },
    {
      key: 'ShockAbsorption',
      shortAxisLabel: 'Shock Abs',
      label: 'Shock Absorption',
      instrument: 'RAA • Opt: 58–68%',
      pVal: primaryEval.hardwareMetrics.shockAbsorptionPct,
      cVal: compareEval.hardwareMetrics.shockAbsorptionPct,
      rVal: refBaseline.hardwareMetrics.shockAbsorptionPct,
      unit: '%',
      scaleMin: 48,
      scaleMax: 74,
      optMin: 58,
      optMax: 68,
      optLabel: '58–68%',
    },
    {
      key: 'EnergyRestitution',
      shortAxisLabel: 'Restitution',
      label: 'Energy Restitution',
      instrument: 'RAA • Opt: 16–21%',
      pVal: primaryEval.hardwareMetrics.energyRestitutionPct,
      cVal: compareEval.hardwareMetrics.energyRestitutionPct,
      rVal: refBaseline.hardwareMetrics.energyRestitutionPct,
      unit: '%',
      scaleMin: 12,
      scaleMax: 26,
      optMin: 16,
      optMax: 21,
      optLabel: '16–21%',
    },
    {
      key: 'RotationalTorque',
      shortAxisLabel: 'Rot. Torque',
      label: 'Rotational Torque',
      instrument: 'RTT • Opt: 35–52 Nm',
      pVal: primaryEval.hardwareMetrics.rotationalResistanceNm,
      cVal: compareEval.hardwareMetrics.rotationalResistanceNm,
      rVal: refBaseline.hardwareMetrics.rotationalResistanceNm,
      unit: 'Nm',
      scaleMin: 25,
      scaleMax: 65,
      optMin: 35,
      optMax: 52,
      optLabel: '35–52 Nm',
    },
    {
      key: 'StudDepth',
      shortAxisLabel: 'Stud Depth',
      label: 'Stud Penetration',
      instrument: 'RTT • Opt: 9.5–13.5 mm',
      pVal: primaryEval.hardwareMetrics.studDepthMm,
      cVal: compareEval.hardwareMetrics.studDepthMm,
      rVal: refBaseline.hardwareMetrics.studDepthMm,
      unit: 'mm',
      scaleMin: 4,
      scaleMax: 16,
      optMin: 9.5,
      optMax: 13.5,
      optLabel: '9.5–13.5 mm',
    },
    {
      key: 'Boot',
      shortAxisLabel: 'Boot Index',
      label: 'Boot Cleat Index',
      instrument: `RTT • A: ${primaryBoot.code} vs B: ${compareBoot.code}`,
      pVal: primaryEval.averages.Boot,
      cVal: compareEval.averages.Boot,
      rVal: refBaseline.averages.Boot,
      unit: '/10',
      scaleMin: 0,
      scaleMax: 10,
      optMin: 2.5,
      optMax: 5.3,
      optLabel: '2.5–5.3',
    },
  ];

  // Normalize any physical metric to 0-10 for the 6-axis Spider / Radar Chart
  const toNorm10 = (val: number, min: number, max: number) =>
    Math.max(0.8, Math.min(9.8, ((val - min) / (max - min)) * 10));

  const toPct = (val: number, min: number, max: number) =>
    Math.max(2, Math.min(98, ((val - min) / (max - min)) * 100));

  // SVG Radar Chart Geometry (matches TrainingGoalRadar exactly: 6 axes, radius 116, center 165,165)
  const cx = 165;
  const cy = 165;
  const maxR = 114;

  const getPoint = (idx: number, normVal10: number) => {
    const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
    const r = (Math.max(0, Math.min(10, normVal10)) / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const makeHardwarePolygon = (which: 'p' | 'c' | 'r') =>
    metrics
      .map((m, i) => {
        const raw = which === 'p' ? m.pVal : which === 'c' ? m.cVal : m.rVal;
        const norm = toNorm10(raw, m.scaleMin, m.scaleMax);
        const pt = getPoint(i, norm);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(' ');

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      {/* Header (Matches TrainingGoalRadar header layout) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E5E9F0]">
        <div>
          <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C69214]" />
            Head-to-Head Hardware &amp; Biomechanical Comparison (RAA &amp; RTT Telemetry)
          </h3>
          <p className="text-xs text-[#64748B] font-medium">
            Comparing <strong className="text-[#001489]">{primaryEval.pitchName}</strong> (Pitch A)
            vs. <strong className="text-[#92400E]">{compareEval.pitchName}</strong> (Pitch B) and{' '}
            <strong className="text-purple-700">{refBaseline.pitchName}</strong> (Purple REF)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-[#001489] font-extrabold">
            <span className="w-3 h-3 rounded-sm bg-[#001489] inline-block" />
            Pitch A: {primaryEval.pitchName}
          </span>
          <span className="flex items-center gap-1.5 text-[#92400E] font-extrabold">
            <span className="w-3 h-3 rounded-sm bg-[#C69214] inline-block" />
            Pitch B: {compareEval.pitchName}
          </span>
          <span className="flex items-center gap-1.5 text-purple-700 font-extrabold">
            <span className="w-3 h-0.5 bg-purple-600 inline-block" />
            REF: {refBaseline.pitchName}
          </span>
          <button
            type="button"
            onClick={onOpenSpatialMap}
            className="px-3 py-1 rounded-[6px] bg-[#001489] hover:bg-[#1E3A8A] border border-[#C69214] text-white font-extrabold shadow-sm transition-all"
          >
            Open Full 18-Zone Spatial Map →
          </button>
        </div>
      </div>

      {/* 12-Column Split Layout: Left 5 Cols 6-Axis Hardware Radar + Right 7 Cols Dual-Bar & Purple REF Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left 5 Columns: 6-Axis Physical Hardware Spider / Radar Plot */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4">
          <svg viewBox="0 0 330 330" className="w-full max-w-[320px] h-auto">
            {/* Concentric Web Rings (2, 4, 6, 8, 10) */}
            {[2, 4, 6, 8, 10].map((level) => (
              <polygon
                key={level}
                points={metrics
                  .map((_, i) => {
                    const pt = getPoint(i, level);
                    return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
            ))}

            {/* Axis Spokes & Labels */}
            {metrics.map((m, i) => {
              const endPt = getPoint(i, 10);
              const lblPt = getPoint(i, 12.1);
              return (
                <g key={m.key}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={endPt.x}
                    y2={endPt.y}
                    stroke="#CBD5E1"
                    strokeWidth="1"
                  />
                  <text
                    x={lblPt.x}
                    y={lblPt.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-[#2E3440] text-[10.5px] font-extrabold"
                  >
                    {m.shortAxisLabel}
                  </text>
                </g>
              );
            })}

            {/* REF Baseline Polygon (Dashed Purple) */}
            <polygon
              points={makeHardwarePolygon('r')}
              fill="rgba(124, 58, 237, 0.06)"
              stroke="#7C3AED"
              strokeWidth="1.75"
              strokeDasharray="4 3"
            />

            {/* Compare Pitch B Polygon (USSF Gold) */}
            <polygon
              points={makeHardwarePolygon('c')}
              fill="rgba(198, 146, 20, 0.18)"
              stroke="#C69214"
              strokeWidth="2"
            />

            {/* Primary Pitch A Polygon (USSF Navy) */}
            <polygon
              points={makeHardwarePolygon('p')}
              fill="rgba(0, 20, 137, 0.18)"
              stroke="#001489"
              strokeWidth="2.5"
            />

            {/* Vertex Dots for Primary Pitch A */}
            {metrics.map((m, i) => {
              const norm = toNorm10(m.pVal, m.scaleMin, m.scaleMax);
              const pt = getPoint(i, norm);
              return (
                <circle
                  key={m.key}
                  cx={pt.x}
                  cy={pt.y}
                  r="4"
                  fill="#001489"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>

          <div className="mt-2 text-[11px] text-[#64748B] font-semibold text-center">
            Normalized 6-axis hardware footprint across <strong className="text-[#2E3440]">RAA</strong>{' '}
            (Hardness, Shock Abs, Restitution) &amp; <strong className="text-[#2E3440]">RTT</strong>{' '}
            (Torque, Stud Depth, Boot)
          </div>
        </div>

        {/* Right 7 Columns: 2x3 Grid of Visual Dual-Bar & Purple REF Marker Cards (Identical pattern to TrainingGoalRadar!) */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {metrics.map((m) => {
            const pPct = toPct(m.pVal, m.scaleMin, m.scaleMax);
            const cPct = toPct(m.cVal, m.scaleMin, m.scaleMax);
            const rPct = toPct(m.rVal, m.scaleMin, m.scaleMax);
            const optLeft = toPct(m.optMin, m.scaleMin, m.scaleMax);
            const optWidth = Math.max(4, toPct(m.optMax, m.scaleMin, m.scaleMax) - optLeft);

            const mag = getMagnitudeAssessment(m.key, m.pVal, m.cVal, m.unit);

            return (
              <div
                key={m.key}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-3.5 flex flex-col justify-between"
              >
                {/* Metric Header + Info Popover Trigger + Standardized Magnitude Pill */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-[#2E3440]">{m.label}</span>
                      <MetricInfoTrigger metricKey={m.key} onOpenModal={onOpenAppendixA} />
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[#64748B]">
                      {m.instrument} •{' '}
                      <span className="text-purple-700">
                        REF {m.rVal}
                        {m.unit}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded border whitespace-nowrap ${mag.badgeClass}`}
                  >
                    {mag.delta > 0 ? `+${mag.delta}` : mag.delta}
                    {m.unit} ({mag.zScore > 0 ? `+${mag.zScore.toFixed(1)}σ` : `${mag.zScore.toFixed(1)}σ`})
                  </span>
                </div>

                {/* Visual Dual Horizontal Progress Bars with Shaded Optimal Band & Shared Purple REF Line */}
                <div className="relative space-y-2 py-1">
                  {/* Vertical Purple REF Marker Line across both bars */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-purple-600 z-20 pointer-events-none"
                    style={{ left: `${rPct}%` }}
                    title={`REF (${refBaseline.pitchName}): ${m.rVal} ${m.unit}`}
                  />

                  {/* Pitch A Horizontal Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-0.5">
                      <span className="text-[#001489] truncate max-w-[155px]">
                        A: {primaryEval.pitchName}
                      </span>
                      <span className="font-mono font-black text-[#001489]">
                        {m.pVal} {m.unit}
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-white border border-[#CBD5E1] rounded-full overflow-hidden">
                      {/* Shaded Green Optimal Band */}
                      <div
                        className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/50"
                        style={{ left: `${optLeft}%`, width: `${optWidth}%` }}
                      />
                      <div
                        className="relative h-full bg-[#001489] rounded-full transition-all duration-300 z-10"
                        style={{ width: `${pPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Pitch B Horizontal Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-0.5">
                      <span className="text-[#92400E] truncate max-w-[155px]">
                        B: {compareEval.pitchName}
                      </span>
                      <span className="font-mono font-black text-[#92400E]">
                        {m.cVal} {m.unit}
                      </span>
                    </div>
                    <div className="relative h-2.5 bg-white border border-[#CBD5E1] rounded-full overflow-hidden">
                      {/* Shaded Green Optimal Band */}
                      <div
                        className="absolute top-0 bottom-0 bg-emerald-500/20 border-x border-emerald-500/50"
                        style={{ left: `${optLeft}%`, width: `${optWidth}%` }}
                      />
                      <div
                        className="relative h-full bg-[#C69214] rounded-full transition-all duration-300 z-10"
                        style={{ width: `${cPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Takeaway Footer */}
                <div className="mt-2 pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px]">
                  <span className="font-extrabold text-[#2E3440]">{mag.directionWord}</span>
                  <span
                    className="text-[#64748B] font-medium truncate max-w-[170px]"
                    title={mag.clinicalNote}
                  >
                    {mag.clinicalNote}
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
