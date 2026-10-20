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
      <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Training Goal Suitability Radar (6-Axis Alignment)
            </h3>
            <p className="text-xs text-slate-400">
              Comparing <strong>{primaryEval.pitchName}</strong> ({primaryEval.date}) vs.{' '}
              <strong>{compareEval.pitchName}</strong> ({compareEval.date}) and{' '}
              <strong>{refBaseline.pitchName}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-300 font-semibold">
              <span className="w-3 h-3 rounded-sm bg-emerald-500/50 border border-emerald-400 inline-block" />
              {primaryEval.pitchName}
            </span>
            <span className="flex items-center gap-1.5 text-sky-300 font-semibold">
              <span className="w-3 h-3 rounded-sm bg-sky-500/40 border border-sky-400 inline-block" />
              {compareEval.pitchName}
            </span>
            <span className="flex items-center gap-1.5 text-violet-300 font-semibold">
              <span className="w-3 h-0.5 bg-violet-400 inline-block" />
              REF Baseline
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* SVG Spider / Radar Plot */}
          <div className="md:col-span-6 flex justify-center">
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
                  stroke="rgba(148, 163, 184, 0.18)"
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
                      stroke="rgba(148, 163, 184, 0.22)"
                      strokeWidth="1"
                    />
                    <text
                      x={lblPt.x}
                      y={lblPt.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-slate-200 text-[11px] font-bold"
                    >
                      {g}
                    </text>
                  </g>
                );
              })}

              {/* REF Baseline Polygon (Dashed Violet) */}
              <polygon
                points={makePolygon(refBaseline.averages)}
                fill="rgba(167, 139, 250, 0.06)"
                stroke="#a78bfa"
                strokeWidth="1.75"
                strokeDasharray="4 3"
              />

              {/* Comparison Pitch Polygon (Sky Blue) */}
              <polygon
                points={makePolygon(compareEval.averages)}
                fill="rgba(56, 189, 248, 0.18)"
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {/* Primary Pitch Polygon (Emerald) */}
              <polygon
                points={makePolygon(primaryEval.averages)}
                fill="rgba(16, 185, 129, 0.25)"
                stroke="#10b981"
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
                    fill="#10b981"
                    stroke="#022c22"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>

          {/* Side-by-Side Training Goal Comparison Table */}
          <div className="md:col-span-6 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
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
                  className="bg-slate-950/75 border border-slate-800/90 rounded-xl px-3 py-2 flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{goal}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      REF: {rVal.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Primary</span>
                      <strong className="text-emerald-400">{pVal.toFixed(2)}</strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Compare</span>
                      <strong className="text-sky-400">{cVal.toFixed(2)}</strong>
                    </div>
                    <div
                      className={`w-14 text-right font-bold px-1.5 py-0.5 rounded text-[11px] ${
                        Math.abs(diff) < 0.08
                          ? 'bg-slate-800 text-slate-400'
                          : diff > 0
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'bg-sky-500/15 text-sky-300'
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
      <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-violet-400" />
                Interactive Surface Simulator (Formula Lab)
              </h3>
              <p className="text-xs text-slate-400">
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
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
              title="Reset to Primary Pitch"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* 3 Input Sliders */}
          <div className="space-y-3.5 mb-5">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Impact (Soft 0 → Hard 10)</span>
                <span className="font-mono font-bold text-emerald-400">{simImpact.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="9.0"
                step="0.05"
                value={simImpact}
                onChange={(e) => setSimImpact(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Energy (Dissipating 0 → Rebounding 10)</span>
                <span className="font-mono font-bold text-teal-400">{simEnergy.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1.5"
                max="9.0"
                step="0.05"
                value={simEnergy}
                onChange={(e) => setSimEnergy(parseFloat(e.target.value))}
                className="w-full accent-teal-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-300">Grip (Low Traction 0 → High Bite 10)</span>
                <span className="font-mono font-bold text-violet-400">{simGrip.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="2.5"
                max="9.5"
                step="0.05"
                value={simGrip}
                onChange={(e) => setSimGrip(parseFloat(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Real-Time Computed Training Goals from Exact Raw Stadia Equations */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-violet-400" />
              Live Raw Stadia Closed-Form Outputs
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TRAINING_GOAL_INDEXES.map((g) => (
                <div
                  key={g}
                  className="bg-slate-900/90 border border-slate-800/80 rounded-lg p-2 text-center"
                >
                  <div className="text-[10px] font-semibold text-slate-400">{g}</div>
                  <div className="text-base font-extrabold text-white font-mono">
                    {simGoals[g].toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simulated Boot Recommendation */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Simulated Boot Index:</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${simBootRec.badgeBg}`}>
              {simBootRec.name} ({simBootVal.toFixed(1)})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{simBootRec.rationale}</p>
        </div>
      </div>
    </div>
  );
};
