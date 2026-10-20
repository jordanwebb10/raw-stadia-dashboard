import React from 'react';
import { Target } from 'lucide-react';
import { PitchEvaluation, TrainingGoalName } from '../types/rawStadia';
import { getMagnitudeAssessment, TRAINING_GOAL_INDEXES } from '../utils/rawStadiaEngine';

interface TrainingGoalRadarProps {
  primaryEval: PitchEvaluation;
  compareEval: PitchEvaluation;
  refBaseline: PitchEvaluation;
  onOpenSimulator?: () => void;
}

const GOAL_EQUATION_LABELS: Record<TrainingGoalName, string> = {
  Speed: '0.5·(I + E) + 0.75',
  Endurance: '11.25 − 0.5·(I + E)',
  Recovery: '5.75 + 0.5·(E − I)',
  Power: '0.5·(I + G) + 0.50',
  Reaction: '(I + E + G)/3 + 0.50',
  Metabolic: '11.50 − (I + E + G)/3',
};

export const TrainingGoalRadar: React.FC<TrainingGoalRadarProps> = ({
  primaryEval,
  compareEval,
  refBaseline,
  onOpenSimulator,
}) => {
  // SVG Radar Chart Geometry (6 axes, radius 115, center 165,165)
  const cx = 165;
  const cy = 165;
  const maxR = 116;

  const getPoint = (idx: number, val: number) => {
    const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
    const r = (Math.max(0, Math.min(10, val)) / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  const makePolygon = (scores: Record<TrainingGoalName, number>) =>
    TRAINING_GOAL_INDEXES.map((g, i) => {
      const pt = getPoint(i, scores[g]);
      return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    }).join(' ');

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E5E9F0]">
        <div>
          <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
            <Target className="w-5 h-5 text-[#C69214]" />
            Training Goal Suitability Radar &amp; Visual Objective Alignment (0–10 Scale)
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
          {onOpenSimulator && (
            <button
              type="button"
              onClick={onOpenSimulator}
              className="px-3 py-1 rounded-[6px] bg-[#F8F9FA] border border-[#CBD5E1] hover:border-[#C69214] text-[#2E3440] font-bold transition-all"
            >
              Open Surface Simulator Lab →
            </button>
          )}
        </div>
      </div>

      {/* 12-Column Layout: Left 5 Cols Radar Plot + Right 7 Cols Visual Dual-Bar & Magnitude Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left 5 Columns: 6-Axis Spider / Radar Plot */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4">
          <svg viewBox="0 0 330 330" className="w-full max-w-[320px] h-auto">
            {/* Concentric Web Rings (2, 4, 6, 8, 10) */}
            {[2, 4, 6, 8, 10].map((level) => (
              <polygon
                key={level}
                points={TRAINING_GOAL_INDEXES.map((_, i) => {
                  const pt = getPoint(i, level);
                  return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
                }).join(' ')}
                fill="none"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
            ))}

            {/* Axis Spokes & Labels */}
            {TRAINING_GOAL_INDEXES.map((g, i) => {
              const endPt = getPoint(i, 10);
              const lblPt = getPoint(i, 12.1);
              return (
                <g key={g}>
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
                    className="fill-[#2E3440] text-[11px] font-extrabold"
                  >
                    {g}
                  </text>
                </g>
              );
            })}

            {/* REF Baseline Polygon (Dashed Purple) */}
            <polygon
              points={makePolygon(refBaseline.averages)}
              fill="rgba(124, 58, 237, 0.06)"
              stroke="#7C3AED"
              strokeWidth="1.75"
              strokeDasharray="4 3"
            />

            {/* Comparison Pitch Polygon (USSF Gold) */}
            <polygon
              points={makePolygon(compareEval.averages)}
              fill="rgba(198, 146, 20, 0.18)"
              stroke="#C69214"
              strokeWidth="2"
            />

            {/* Primary Pitch Polygon (USSF Navy) */}
            <polygon
              points={makePolygon(primaryEval.averages)}
              fill="rgba(0, 20, 137, 0.18)"
              stroke="#001489"
              strokeWidth="2.5"
            />

            {/* Vertex Dots for Primary Pitch */}
            {TRAINING_GOAL_INDEXES.map((g, i) => {
              const pt = getPoint(i, primaryEval.averages[g]);
              return (
                <circle
                  key={g}
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
            Opposite axes represent complementary mechanical pairs:{' '}
            <strong className="text-[#2E3440]">Speed + Endurance = 12.0</strong> and{' '}
            <strong className="text-[#2E3440]">Reaction + Metabolic = 12.0</strong>
          </div>
        </div>

        {/* Right 7 Columns: Visual Dual-Bar & Diverging Magnitude Matrix (Visual + Numeric) */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {TRAINING_GOAL_INDEXES.map((goal) => {
            const pVal = primaryEval.averages[goal];
            const cVal = compareEval.averages[goal];
            const rVal = refBaseline.averages[goal];

            const pPct = Math.max(0, Math.min(100, (pVal / 10) * 100));
            const cPct = Math.max(0, Math.min(100, (cVal / 10) * 100));
            const rPct = Math.max(0, Math.min(100, (rVal / 10) * 100));

            const mag = getMagnitudeAssessment(goal, pVal, cVal);

            return (
              <div
                key={goal}
                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-3.5 flex flex-col justify-between"
              >
                {/* Goal Header + Standardized Magnitude Badge */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <div className="text-sm font-black text-[#2E3440]">{goal}</div>
                    <div className="text-[10px] font-mono font-bold text-[#64748B]">
                      {GOAL_EQUATION_LABELS[goal]} •{' '}
                      <span className="text-purple-700">REF {rVal.toFixed(2)}</span>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded border whitespace-nowrap ${mag.badgeClass}`}
                  >
                    {mag.delta > 0 ? `+${mag.delta.toFixed(2)}` : mag.delta.toFixed(2)} (
                    {mag.zScore > 0 ? `+${mag.zScore.toFixed(1)}σ` : `${mag.zScore.toFixed(1)}σ`})
                  </span>
                </div>

                {/* Visual Dual Horizontal Progress Bars with Shared Purple REF Marker */}
                <div className="relative space-y-2 py-1">
                  {/* Vertical Purple REF Marker Line across both bars */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-purple-600 z-20 pointer-events-none"
                    style={{ left: `${rPct}%` }}
                    title={`REF (${refBaseline.pitchName}): ${rVal.toFixed(2)}`}
                  />

                  {/* Pitch A Horizontal Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-0.5">
                      <span className="text-[#001489] truncate max-w-[160px]">
                        A: {primaryEval.pitchName}
                      </span>
                      <span className="font-mono font-black text-[#001489]">{pVal.toFixed(2)}</span>
                    </div>
                    <div className="h-2.5 bg-white border border-[#CBD5E1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#001489] rounded-full transition-all duration-300"
                        style={{ width: `${pPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Pitch B Horizontal Bar */}
                  <div>
                    <div className="flex justify-between text-[10px] font-bold mb-0.5">
                      <span className="text-[#92400E] truncate max-w-[160px]">
                        B: {compareEval.pitchName}
                      </span>
                      <span className="font-mono font-black text-[#92400E]">{cVal.toFixed(2)}</span>
                    </div>
                    <div className="h-2.5 bg-white border border-[#CBD5E1] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C69214] rounded-full transition-all duration-300"
                        style={{ width: `${cPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Takeaway Footer */}
                <div className="mt-2 pt-1.5 border-t border-[#E2E8F0] flex items-center justify-between text-[10px]">
                  <span className="font-extrabold text-[#2E3440]">{mag.directionWord}</span>
                  <span className="text-[#64748B] font-medium truncate max-w-[170px]" title={mag.clinicalNote}>
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
