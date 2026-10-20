import React from 'react';
import { Sparkles } from 'lucide-react';
import { PitchEvaluation } from '../types/rawStadia';
import { getBootRecommendation, getMagnitudeAssessment } from '../utils/rawStadiaEngine';
import { MetricInfoTrigger } from './AppendixAModal';

interface HeadToHeadVisualComparisonProps {
  primaryEval: PitchEvaluation;
  compareEval: PitchEvaluation;
  onOpenSpatialMap: () => void;
  onOpenAppendixA: (metricKey: string) => void;
}

interface HardwareTrackSpec {
  key: string;
  label: string;
  instrument: 'RAA Vertical' | 'RTT Rotational';
  pVal: number;
  cVal: number;
  unit: string;
  scaleMin: number;
  scaleMax: number;
  optMin: number;
  optMax: number;
  optLabel: string;
  extraSub?: string;
}

export const HeadToHeadVisualComparison: React.FC<HeadToHeadVisualComparisonProps> = ({
  primaryEval,
  compareEval,
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

  const tracks: HardwareTrackSpec[] = [
    {
      key: 'Hardness',
      label: 'Surface Hardness (Clegg / RAA)',
      instrument: 'RAA Vertical',
      pVal: primaryEval.hardwareMetrics.hardnessGm,
      cVal: compareEval.hardwareMetrics.hardnessGm,
      unit: 'Gm',
      scaleMin: 50,
      scaleMax: 105,
      optMin: 65,
      optMax: 85,
      optLabel: '65–85 Gm',
    },
    {
      key: 'ShockAbsorption',
      label: 'Shock Absorption (Force Reduction)',
      instrument: 'RAA Vertical',
      pVal: primaryEval.hardwareMetrics.shockAbsorptionPct,
      cVal: compareEval.hardwareMetrics.shockAbsorptionPct,
      unit: '%',
      scaleMin: 48,
      scaleMax: 74,
      optMin: 58,
      optMax: 68,
      optLabel: '58–68%',
    },
    {
      key: 'EnergyRestitution',
      label: 'Energy Restitution (Vertical Return)',
      instrument: 'RAA Vertical',
      pVal: primaryEval.hardwareMetrics.energyRestitutionPct,
      cVal: compareEval.hardwareMetrics.energyRestitutionPct,
      unit: '%',
      scaleMin: 12,
      scaleMax: 26,
      optMin: 16,
      optMax: 21,
      optLabel: '16–21%',
    },
    {
      key: 'RotationalTorque',
      label: 'Rotational Resistance (Peak Torque)',
      instrument: 'RTT Rotational',
      pVal: primaryEval.hardwareMetrics.rotationalResistanceNm,
      cVal: compareEval.hardwareMetrics.rotationalResistanceNm,
      unit: 'Nm',
      scaleMin: 25,
      scaleMax: 65,
      optMin: 35,
      optMax: 52,
      optLabel: '35–52 Nm',
    },
    {
      key: 'StudDepth',
      label: 'Stud Penetration Depth',
      instrument: 'RTT Rotational',
      pVal: primaryEval.hardwareMetrics.studDepthMm,
      cVal: compareEval.hardwareMetrics.studDepthMm,
      unit: 'mm',
      scaleMin: 4,
      scaleMax: 16,
      optMin: 9.5,
      optMax: 13.5,
      optLabel: '9.5–13.5 mm',
    },
    {
      key: 'Boot',
      label: 'Boot Cleat Selection Index',
      instrument: 'RTT Rotational',
      pVal: primaryEval.averages.Boot,
      cVal: compareEval.averages.Boot,
      unit: '/10',
      scaleMin: 0,
      scaleMax: 10,
      optMin: 2.5,
      optMax: 5.3,
      optLabel: '2.5–5.3 (Mixed / FG-L)',
      extraSub: `Pitch A: ${primaryBoot.code} vs Pitch B: ${compareBoot.code}`,
    },
  ];

  const toPct = (val: number, min: number, max: number) =>
    Math.max(2, Math.min(98, ((val - min) / (max - min)) * 100));

  return (
    <div
      className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
      style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
    >
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E5E9F0]">
        <div>
          <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C69214]" />
            Visual Head-to-Head Field Comparison: {primaryEval.pitchName} ({primaryEval.date}) vs.{' '}
            {compareEval.pitchName} ({compareEval.date})
          </h3>
          <p className="text-xs text-[#64748B] font-medium">
            Dumbbell range comparison across RAA &amp; RTT physical hardware metrics against FIFA /
            Raw Stadia optimal windows
          </p>
        </div>

        {/* Visual Legend + Action Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[7px] px-3 py-1.5 text-xs">
            <span className="flex items-center gap-1.5 font-extrabold text-[#001489]">
              <span className="w-4 h-4 rounded-full bg-[#001489] text-white text-[9px] flex items-center justify-center font-black">
                A
              </span>
              {primaryEval.pitchName}
            </span>
            <span className="flex items-center gap-1.5 font-extrabold text-[#92400E]">
              <span className="w-4 h-4 rounded-full bg-[#C69214] text-white text-[9px] flex items-center justify-center font-black">
                B
              </span>
              {compareEval.pitchName}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-800">
              <span className="w-3.5 h-2.5 rounded-sm bg-emerald-500/25 border border-emerald-500 inline-block" />
              Optimal Band
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenSpatialMap}
            className="px-3.5 py-1.5 rounded-[7px] bg-[#001489] hover:bg-[#1E3A8A] border border-[#C69214] text-white text-xs font-extrabold shadow-sm transition-all"
          >
            Open Full 18-Zone Spatial Map →
          </button>
        </div>
      </div>

      {/* 2-Column Visual Dumbbell / Bullet Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {tracks.map((tr) => {
          const pPct = toPct(tr.pVal, tr.scaleMin, tr.scaleMax);
          const cPct = toPct(tr.cVal, tr.scaleMin, tr.scaleMax);
          const optLeft = toPct(tr.optMin, tr.scaleMin, tr.scaleMax);
          const optRight = toPct(tr.optMax, tr.scaleMin, tr.scaleMax);
          const optWidth = Math.max(4, optRight - optLeft);

          const bridgeLeft = Math.min(pPct, cPct);
          const bridgeWidth = Math.abs(pPct - cPct);

          const mag = getMagnitudeAssessment(tr.key, tr.pVal, tr.cVal, tr.unit);

          return (
            <div
              key={tr.key}
              className="bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[10px] p-4 flex flex-col justify-between transition-colors"
            >
              {/* Row 1: Metric Title + Info Button + Standardized Magnitude Pill */}
              <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#2E3440]">{tr.label}</span>
                    <MetricInfoTrigger metricKey={tr.key} onOpenModal={onOpenAppendixA} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.05em] text-[#64748B] mt-0.5">
                    {tr.instrument} • Optimal Window:{' '}
                    <span className="text-emerald-700 font-extrabold">{tr.optLabel}</span>
                    {tr.extraSub && (
                      <span className="ml-1.5 text-[#001489] font-extrabold">• {tr.extraSub}</span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${mag.badgeClass}`}
                >
                  {mag.summaryText}
                </span>
              </div>

              {/* Row 2: Visual Dumbbell / Bullet Range Track */}
              <div className="my-2 px-2">
                <div className="relative h-6 rounded-full bg-white border border-[#CBD5E1] flex items-center shadow-inner">
                  {/* Shaded Green FIFA / Raw Stadia Optimal Band */}
                  <div
                    className="absolute h-full bg-emerald-500/20 border-x-2 border-emerald-500/60"
                    style={{ left: `${optLeft}%`, width: `${optWidth}%` }}
                    title={`Optimal Range: ${tr.optLabel}`}
                  />

                  {/* Connecting Dumbbell Vector Bar between Pitch B and Pitch A */}
                  {bridgeWidth > 0.8 && (
                    <div
                      className="absolute h-2 rounded-full z-10 transition-all duration-300"
                      style={{
                        left: `${bridgeLeft}%`,
                        width: `${bridgeWidth}%`,
                        backgroundColor: mag.barColor,
                        opacity: 0.75,
                      }}
                    />
                  )}

                  {/* Pitch B Node (USSF Gold 'B') */}
                  <div
                    className="absolute w-5 h-5 rounded-full bg-[#C69214] border-2 border-white shadow-md z-20 -translate-x-1/2 flex items-center justify-center text-[9px] font-black text-white transition-all duration-300"
                    style={{ left: `${cPct}%` }}
                    title={`Pitch B (${compareEval.pitchName}): ${tr.cVal} ${tr.unit}`}
                  >
                    B
                  </div>

                  {/* Pitch A Node (USSF Navy 'A') */}
                  <div
                    className="absolute w-5 h-5 rounded-full bg-[#001489] border-2 border-white shadow-md z-30 -translate-x-1/2 flex items-center justify-center text-[9px] font-black text-white transition-all duration-300"
                    style={{ left: `${pPct}%` }}
                    title={`Pitch A (${primaryEval.pitchName}): ${tr.pVal} ${tr.unit}`}
                  >
                    A
                  </div>
                </div>

                {/* Scale Endpoints */}
                <div className="flex justify-between text-[9px] font-mono font-bold text-[#94A3B8] mt-1">
                  <span>
                    {tr.scaleMin} {tr.unit}
                  </span>
                  <span className="text-emerald-700">Target: {tr.optLabel}</span>
                  <span>
                    {tr.scaleMax} {tr.unit}
                  </span>
                </div>
              </div>

              {/* Row 3: Numeric Values + Biomechanical Takeaway */}
              <div className="mt-2 pt-2 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-4 font-mono">
                  <div>
                    <span className="text-[10px] font-sans font-extrabold text-[#001489] mr-1">
                      Pitch A:
                    </span>
                    <strong className="text-[#2E3440] font-black">
                      {tr.pVal} {tr.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-sans font-extrabold text-[#92400E] mr-1">
                      Pitch B:
                    </span>
                    <strong className="text-[#64748B] font-bold">
                      {tr.cVal} {tr.unit}
                    </strong>
                  </div>
                </div>

                <span className="text-[11px] text-[#434C5E] font-medium">{mag.clinicalNote}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
