import React, { useState } from 'react';
import { Calculator, RotateCcw, Sliders, Target } from 'lucide-react';
import { PitchEvaluation, TrainingGoalName } from '../types/rawStadia';
import {
  computeTrainingGoals,
  getBootRecommendation,
  TRAINING_GOAL_INDEXES,
} from '../utils/rawStadiaEngine';

interface TrainingGoalRadarProps {
  primaryEval: PitchEvaluation;
  compareEval: PitchEvaluation;
  refBaseline: PitchEvaluation;
}

export const TrainingGoalRadar: React.FC<TrainingGoalRadarProps> = ({
  primaryEval,
  compareEval,
  refBaseline,
}) => {
  // Interactive "What-If" Surface Simulator state initialized to primaryEval
  const [simImpact, setSimImpact] = useState<number>(primaryEval.averages.Impact);
  const [simEnergy, setSimEnergy] = useState<number>(primaryEval.averages.Energy);
  const [simGrip, setSimGrip] = useState<number>(primaryEval.averages.Grip);

  const simGoals = computeTrainingGoals(simImpact, simEnergy, simGrip);
  const simBootVal = Number(Math.max(1.0, Math.min(9.0, 10.1 - simGrip)).toFixed(2));
  const simBootRec = getBootRecommendation(simBootVal, undefined, simGrip);

  // SVG Radar Chart Geometry (6 axes, radius 110, center 160,160)
  const cx = 160;
  const cy = 160;
  const maxR = 112;

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Columns: 6-Axis Radar Comparison + Goal Ranking Table */}
      <div
        className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-[10px] p-5"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#E5E9F0]">
          <div>
            <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#C69214]" />
              Training Goal Suitability Radar (6-Axis Alignment)
            </h3>
            <p className="text-xs text-[#64748B] font-medium">
              Comparing <strong className="text-[#001489]">{primaryEval.pitchName}</strong> ({primaryEval.date}) vs.{' '}
              <strong className="text-[#92400E]">{compareEval.pitchName}</strong> ({compareEval.date}) and{' '}
              <strong className="text-purple-700">{refBaseline.pitchName}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#001489] font-extrabold">
              <span className="w-3 h-3 rounded-sm bg-[#001489]/20 border border-[#001489] inline-block" />
              {primaryEval.pitchName}
            </span>
            <span className="flex items-center gap-1.5 text-[#92400E] font-extrabold">
              <span className="w-3 h-3 rounded-sm bg-[#C69214]/25 border border-[#C69214] inline-block" />
              {compareEval.pitchName}
            </span>
            <span className="flex items-center gap-1.5 text-purple-700 font-extrabold">
              <span className="w-3 h-0.5 bg-purple-600 inline-block" />
              REF Baseline
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* SVG Spider / Radar Plot */}
          <div className="md:col-span-6 flex justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-3">
            <svg viewBox="0 0 320 320" className="w-full max-w-[300px] h-auto">
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
          </div>

          {/* Side-by-Side Training Goal Comparison Table */}
          <div className="md:col-span-6 space-y-2">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] mb-2">
              Session Objective Suitability Matrix
            </div>
            {TRAINING_GOAL_INDEXES.map((goal) => {
              const pVal = primaryEval.averages[goal];
              const cVal = compareEval.averages[goal];
              const rVal = refBaseline.averages[goal];
              const diff = Number((pVal - cVal).toFixed(2));
              return (
                <div
                  key={goal}
                  className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-extrabold text-[#2E3440]">{goal}</div>
                    <div className="text-[10px] text-purple-700 font-mono font-bold">
                      REF: {rVal.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-[#64748B] font-sans font-bold block">Pitch A</span>
                      <strong className="text-[#001489]">{pVal.toFixed(2)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#64748B] font-sans font-bold block">Pitch B</span>
                      <strong className="text-[#92400E]">{cVal.toFixed(2)}</strong>
                    </div>
                    <div
                      className={`w-14 text-right font-bold px-1.5 py-0.5 rounded text-[11px] border ${
                        Math.abs(diff) < 0.08
                          ? 'bg-white border-[#CBD5E1] text-[#64748B]'
                          : diff > 0
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                          : 'bg-blue-50 border-blue-200 text-[#001489]'
                      }`}
                    >
                      {diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right 5 Columns: Interactive Raw Stadia Formula Simulator ("What-If" Lab) */}
      <div
        className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col justify-between"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E9F0]">
            <div>
              <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#C69214]" />
                Interactive Surface Simulator (Formula Lab)
              </h3>
              <p className="text-xs text-[#64748B] font-medium">
                Adjust Impact, Energy, and Grip to test how mowing, rolling, or watering alters
                Training Goal alignment &amp; Boot selection.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSimImpact(primaryEval.averages.Impact);
                setSimEnergy(primaryEval.averages.Energy);
                setSimGrip(primaryEval.averages.Grip);
              }}
              className="px-2.5 py-1.5 rounded-[7px] bg-[#F8F9FA] border border-[#CBD5E1] hover:border-[#C69214] text-[#2E3440] text-xs font-bold flex items-center gap-1 transition-all"
              title="Reset to Primary Pitch"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#C69214]" />
              Reset
            </button>
          </div>

          {/* 3 Input Sliders */}
          <div className="space-y-3.5 mb-5">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#434C5E]">Impact (Soft 0 → Hard 10)</span>
                <span className="font-mono font-extrabold text-[#001489]">{simImpact.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="9.0"
                step="0.05"
                value={simImpact}
                onChange={(e) => setSimImpact(parseFloat(e.target.value))}
                className="w-full accent-[#001489] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#434C5E]">Energy (Dissipating 0 → Rebounding 10)</span>
                <span className="font-mono font-extrabold text-emerald-700">{simEnergy.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="9.0"
                step="0.05"
                value={simEnergy}
                onChange={(e) => setSimEnergy(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-[#434C5E]">Grip (Low Traction 0 → High Bite 10)</span>
                <span className="font-mono font-extrabold text-[#C69214]">{simGrip.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="2.5"
                max="9.5"
                step="0.05"
                value={simGrip}
                onChange={(e) => setSimGrip(parseFloat(e.target.value))}
                className="w-full accent-[#C69214] cursor-pointer"
              />
            </div>
          </div>

          {/* Real-Time Computed Training Goals from Exact Raw Stadia Equations */}
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3.5 mb-4">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] mb-2.5 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-[#C69214]" />
              Live Raw Stadia Closed-Form Outputs
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TRAINING_GOAL_INDEXES.map((g) => (
                <div
                  key={g}
                  className="bg-white border border-[#E2E8F0] rounded-[7px] p-2 text-center shadow-sm"
                >
                  <div className="text-[10px] font-bold text-[#64748B]">{g}</div>
                  <div className="text-base font-black text-[#2E3440] font-mono">
                    {simGoals[g].toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simulated Boot Recommendation */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#2E3440]">Simulated Boot Index:</span>
            <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${simBootRec.badgeBg}`}>
              {simBootRec.name} ({simBootVal.toFixed(1)})
            </span>
          </div>
          <p className="text-[11px] text-[#434C5E] mt-1 font-medium">{simBootRec.rationale}</p>
        </div>
      </div>
    </div>
  );
};
