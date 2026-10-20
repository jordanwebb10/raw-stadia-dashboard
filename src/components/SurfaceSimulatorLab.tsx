import React, { useState } from 'react';
import { Calculator, Footprints, RotateCcw, Sliders, Sparkles } from 'lucide-react';
import { PitchEvaluation, TrainingGoalName } from '../types/rawStadia';
import {
  computeTrainingGoals,
  getBootRecommendation,
  getMagnitudeAssessment,
  TRAINING_GOAL_INDEXES,
} from '../utils/rawStadiaEngine';

interface SurfaceSimulatorLabProps {
  primaryEval: PitchEvaluation;
  refBaseline: PitchEvaluation;
}

export const SurfaceSimulatorLab: React.FC<SurfaceSimulatorLabProps> = ({
  primaryEval,
  refBaseline,
}) => {
  const [simImpact, setSimImpact] = useState<number>(primaryEval.averages.Impact);
  const [simEnergy, setSimEnergy] = useState<number>(primaryEval.averages.Energy);
  const [simGrip, setSimGrip] = useState<number>(primaryEval.averages.Grip);

  const simGoals = computeTrainingGoals(simImpact, simEnergy, simGrip);
  const simBootVal = Number(Math.max(1.0, Math.min(9.0, 10.1 - simGrip)).toFixed(2));
  const simBootRec = getBootRecommendation(simBootVal, undefined, simGrip);

  const applyPreset = (imp: number, eng: number, grp: number) => {
    setSimImpact(imp);
    setSimEnergy(eng);
    setSimGrip(grp);
  };

  // Radar geometry for comparing Simulated Surface vs Primary Pitch A
  const cx = 155;
  const cy = 155;
  const maxR = 108;

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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Sliders, Agronomic Presets & Simulated Footwear */}
        <div
          className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-[10px] p-6 flex flex-col justify-between"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-[#E5E9F0]">
              <div>
                <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#C69214]" />
                  Interactive Surface Simulator ("What-If" Grounds &amp; Load Lab)
                </h3>
                <p className="text-xs text-[#64748B] font-medium">
                  Simulate how mowing, rolling, aeration, or pre-session watering shifts the 6
                  Training Goal scores and cleat selection relative to{' '}
                  <strong className="text-[#001489]">{primaryEval.pitchName}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  applyPreset(
                    primaryEval.averages.Impact,
                    primaryEval.averages.Energy,
                    primaryEval.averages.Grip
                  )
                }
                className="px-3 py-1.5 rounded-[7px] bg-[#F8F9FA] border border-[#CBD5E1] hover:border-[#C69214] text-[#2E3440] text-xs font-extrabold flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C69214]" />
                Reset to {primaryEval.pitchName}
              </button>
            </div>

            {/* Quick Groundskeeping Scenario Presets */}
            <div className="mb-5">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.06em] text-[#64748B] mb-2">
                Agronomic &amp; Periodization Scenario Presets
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset(5.4, 4.9, 6.8)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] hover:border-[#001489] text-xs font-bold text-[#2E3440]"
                >
                  ⚡ Fast Match Day (Rolled &amp; Short Cut)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(3.8, 4.4, 6.1)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] hover:border-[#001489] text-xs font-bold text-[#2E3440]"
                >
                  🌱 MD+1 Recovery (Aerated &amp; Compliant)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(4.3, 3.6, 5.5)}
                  className="px-2.5 py-1.5 rounded-[6px] bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#CBD5E1] hover:border-[#001489] text-xs font-bold text-[#2E3440]"
                >
                  💧 Heavy Rain / Wet Rootzone (SG/Mixed)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyPreset(
                      refBaseline.averages.Impact,
                      refBaseline.averages.Energy,
                      refBaseline.averages.Grip
                    )
                  }
                  className="px-2.5 py-1.5 rounded-[6px] bg-purple-50 hover:bg-purple-100 border border-purple-300 text-xs font-bold text-purple-900"
                >
                  🎯 Match {refBaseline.pitchName}
                </button>
              </div>
            </div>

            {/* 3 Input Sliders */}
            <div className="space-y-4 mb-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4">
              <div>
                <div className="flex justify-between text-xs font-extrabold mb-1">
                  <span className="text-[#2E3440]">
                    Impact Index (Soft 0 → Hard 10){' '}
                    <span className="text-[#64748B] font-normal">
                      [Pitch A: {primaryEval.averages.Impact.toFixed(2)}]
                    </span>
                  </span>
                  <span className="font-mono font-black text-base text-[#001489]">
                    {simImpact.toFixed(2)}
                  </span>
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
                <div className="flex justify-between text-xs font-extrabold mb-1">
                  <span className="text-[#2E3440]">
                    Energy Index (Dissipating 0 → Rebounding 10){' '}
                    <span className="text-[#64748B] font-normal">
                      [Pitch A: {primaryEval.averages.Energy.toFixed(2)}]
                    </span>
                  </span>
                  <span className="font-mono font-black text-base text-emerald-700">
                    {simEnergy.toFixed(2)}
                  </span>
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
                <div className="flex justify-between text-xs font-extrabold mb-1">
                  <span className="text-[#2E3440]">
                    Grip Index (Low Traction 0 → High Bite 10){' '}
                    <span className="text-[#64748B] font-normal">
                      [Pitch A: {primaryEval.averages.Grip.toFixed(2)}]
                    </span>
                  </span>
                  <span className="font-mono font-black text-base text-[#C69214]">
                    {simGrip.toFixed(2)}
                  </span>
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
          </div>

          {/* Simulated Boot Recommendation */}
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] border-l-[4px] border-l-[#001489] rounded-[8px] p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold uppercase tracking-[0.05em] text-[#001489] flex items-center gap-1.5">
                <Footprints className="w-4 h-4 text-[#C69214]" />
                Simulated Footwear Recommendation
              </span>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded border ${simBootRec.badgeBg}`}
              >
                {simBootRec.code} • Index {simBootVal.toFixed(2)}
              </span>
            </div>
            <div className="text-sm font-black text-[#2E3440]">{simBootRec.name}</div>
            <p className="text-xs text-[#434C5E] font-medium mt-0.5">{simBootRec.rationale}</p>
          </div>
        </div>

        {/* Right 6 Columns: Live Simulated Radar + Closed-Form Training Goal Bars */}
        <div
          className="lg:col-span-6 bg-white border border-[#E2E8F0] rounded-[10px] p-6 flex flex-col justify-between"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-[#E5E9F0]">
            <div>
              <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#C69214]" />
                Simulated Training Goal Output vs. {primaryEval.pitchName}
              </h3>
              <p className="text-xs text-[#64748B] font-medium">
                Real-time closed-form Raw Stadia equations computed from your slider inputs
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-extrabold text-[#001489]">
                <span className="w-3 h-3 rounded-sm bg-[#001489]/25 border border-[#001489] inline-block" />
                Simulated Pitch
              </span>
              <span className="flex items-center gap-1.5 font-extrabold text-[#92400E]">
                <span className="w-3 h-0.5 bg-[#C69214] inline-block" />
                Actual {primaryEval.pitchName}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 flex justify-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-2">
              <svg viewBox="0 0 310 310" className="w-full max-w-[240px] h-auto">
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
                <polygon
                  points={makePolygon(primaryEval.averages)}
                  fill="rgba(198, 146, 20, 0.14)"
                  stroke="#C69214"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
                <polygon
                  points={makePolygon(simGoals)}
                  fill="rgba(0, 20, 137, 0.22)"
                  stroke="#001489"
                  strokeWidth="2.5"
                />
              </svg>
            </div>

            <div className="md:col-span-7 space-y-2">
              {TRAINING_GOAL_INDEXES.map((g) => {
                const simV = simGoals[g];
                const actV = primaryEval.averages[g];
                const mag = getMagnitudeAssessment(g, simV, actV);
                return (
                  <div
                    key={g}
                    className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2.5"
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-extrabold text-[#2E3440] flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#C69214]" />
                        {g}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <strong className="text-[#001489] font-black">{simV.toFixed(2)}</strong>
                        <span
                          className={`text-[10px] font-sans font-extrabold px-1.5 py-0.5 rounded border ${mag.badgeClass}`}
                        >
                          {mag.delta > 0 ? `+${mag.delta.toFixed(2)}` : mag.delta.toFixed(2)} (
                          {mag.zScore > 0 ? `+${mag.zScore.toFixed(1)}σ` : `${mag.zScore.toFixed(1)}σ`})
                        </span>
                      </div>
                    </div>
                    <div className="relative h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#001489] rounded-full transition-all duration-200"
                        style={{ width: `${Math.min(100, (simV / 10) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
