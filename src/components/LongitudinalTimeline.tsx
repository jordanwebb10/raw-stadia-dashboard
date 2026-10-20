import React, { useState } from 'react';
import { Award, Calendar, CheckCircle2, TrendingUp } from 'lucide-react';
import { IndexName, PitchEvaluation } from '../types/rawStadia';
import { ALL_INDEX_NAMES, getBootRecommendation } from '../utils/rawStadiaEngine';

interface LongitudinalTimelineProps {
  evaluations: PitchEvaluation[];
  selectedPrimaryId: string;
  selectedCompareId: string;
  onSelectPrimary: (id: string) => void;
  onSelectCompare: (id: string) => void;
}

export const LongitudinalTimeline: React.FC<LongitudinalTimelineProps> = ({
  evaluations,
  selectedPrimaryId,
  selectedCompareId,
  onSelectPrimary,
  onSelectCompare,
}) => {
  const [trendMetric, setTrendMetric] = useState<IndexName>('Impact');
  const [venueFilter, setVenueFilter] = useState<'ALL' | 'NTC' | 'STADIUM'>('ALL');

  const ntcDates = ['2026-09-02', '2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-28'];
  const pitchSeries = [
    { name: 'USSF Super 3', color: '#38bdf8', stroke: '#38bdf8' },
    { name: 'USSF Super 4', color: '#10b981', stroke: '#10b981' },
    { name: 'USSF Super 5', color: '#f59e0b', stroke: '#f59e0b' },
  ];

  const stadiumEvals = evaluations.filter(
    (e) => !e.pitchName.startsWith('USSF Super')
  );

  const filteredEvals = evaluations.filter((e) => {
    if (venueFilter === 'NTC') return e.pitchName.startsWith('USSF Super');
    if (venueFilter === 'STADIUM') return !e.pitchName.startsWith('USSF Super');
    return true;
  });

  // SVG Chart dimensions for NTC Longitudinal Progression
  const w = 720;
  const h = 230;
  const padL = 44;
  const padR = 28;
  const padT = 20;
  const padB = 34;

  const getX = (idx: number) =>
    padL + (idx / Math.max(1, ntcDates.length - 1)) * (w - padL - padR);
  const getY = (val: number) => {
    const minV = 2.0;
    const maxV = 8.5;
    const clamped = Math.max(minV, Math.min(maxV, val));
    return padT + (1 - (clamped - minV) / (maxV - minV)) * (h - padT - padB);
  };

  return (
    <div className="space-y-6">
      {/* Top Row: NTC Longitudinal Trend Chart + Match Day Stadium Progression */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left 7 Cols: NTC Super 3, 4, 5 Progression Over Camp */}
        <div className="xl:col-span-7 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                NTC Longitudinal Surface Evolution (Sept 2 → Sept 28)
              </h3>
              <p className="text-xs text-slate-400">
                Tracking daily RAA &amp; RTT surface shifts across USSF Super 3, Super 4, and Super 5
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {(['Impact', 'Energy', 'Grip', 'Reaction', 'Metabolic', 'Recovery', 'Speed'] as IndexName[]).map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setTrendMetric(m)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                      trendMetric === m
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                )
              )}
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto min-w-[500px]">
              {/* Horizontal grid lines */}
              {[3, 4, 5, 6, 7, 8].map((gv) => {
                const y = getY(gv);
                return (
                  <g key={gv}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={w - padR}
                      y2={y}
                      stroke="rgba(148, 163, 184, 0.14)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px] font-mono"
                    >
                      {gv.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* X-axis date labels */}
              {ntcDates.map((d, idx) => {
                const x = getX(idx);
                return (
                  <g key={d}>
                    <line
                      x1={x}
                      y1={padT}
                      x2={x}
                      y2={h - padB}
                      stroke="rgba(148, 163, 184, 0.08)"
                    />
                    <text
                      x={x}
                      y={h - 10}
                      textAnchor="middle"
                      className="fill-slate-300 text-[11px] font-semibold"
                    >
                      {d.slice(5)}
                    </text>
                  </g>
                );
              })}

              {/* Lines for Super 3, Super 4, Super 5 */}
              {pitchSeries.map((s) => {
                const pts = ntcDates
                  .map((d, idx) => {
                    const ev = evaluations.find((e) => e.pitchName === s.name && e.date === d);
                    if (!ev) return null;
                    return {
                      x: getX(idx),
                      y: getY(ev.averages[trendMetric]),
                      val: ev.averages[trendMetric],
                      id: ev.id,
                      date: d,
                    };
                  })
                  .filter(Boolean) as { x: number; y: number; val: number; id: string; date: string }[];

                return (
                  <g key={s.name}>
                    <polyline
                      fill="none"
                      stroke={s.stroke}
                      strokeWidth="3"
                      points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
                    />
                    {pts.map((p) => (
                      <g
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => onSelectPrimary(p.id)}
                      >
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r="5.5"
                          fill={s.color}
                          stroke="#0f172a"
                          strokeWidth="2"
                        />
                        <text
                          x={p.x}
                          y={p.y - 9}
                          textAnchor="middle"
                          className="fill-slate-200 text-[10px] font-mono font-bold"
                        >
                          {p.val.toFixed(2)}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 mt-2 pt-3 border-t border-slate-800 text-xs">
            <div className="flex items-center gap-4">
              {pitchSeries.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5 font-semibold text-slate-200">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </span>
              ))}
            </div>
            <span className="text-slate-400">
              Tip: Click any data node on the trend line to load that evaluation into the 18-zone
              spatial viewer.
            </span>
          </div>
        </div>

        {/* Right 5 Cols: Match Day Stadium Tour Progression (Orlando -> St. Louis -> Arizona -> Minnesota) */}
        <div className="xl:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="pb-3 mb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Match Day Stadium Tour vs. NTC Baseline
              </h3>
              <p className="text-xs text-slate-400">
                Comparing the 5 away/match stadium evaluations against the NTC Camp Composite (Impact
                4.34 | Energy 4.04 | Grip 6.33)
              </p>
            </div>

            <div className="space-y-3">
              {stadiumEvals.map((st) => {
                const bootRec = getBootRecommendation(
                  st.averages.Boot,
                  st.hardwareMetrics.studDepthMm,
                  st.averages.Grip
                );
                const isPrimary = st.id === selectedPrimaryId;
                return (
                  <div
                    key={st.id}
                    onClick={() => onSelectPrimary(st.id)}
                    className={`cursor-pointer p-3.5 rounded-xl border transition-all ${
                      isPrimary
                        ? 'bg-emerald-500/15 border-emerald-500/50'
                        : 'bg-slate-950/75 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                          {st.date} • {st.sessionObjective}
                        </span>
                        <h4 className="text-sm font-bold text-white">{st.pitchName}</h4>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${bootRec.badgeBg}`}>
                        {bootRec.code} ({st.hardwareMetrics.studDepthMm}mm)
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs font-mono mt-2 pt-2 border-t border-slate-800/80">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Impact</span>
                        <strong className={st.averages.Impact > 6.0 ? 'text-rose-400' : 'text-white'}>
                          {st.averages.Impact.toFixed(2)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Energy</span>
                        <strong className="text-teal-300">{st.averages.Energy.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Grip</span>
                        <strong className="text-violet-300">{st.averages.Grip.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Hardness</span>
                        <strong className="text-amber-300">{st.hardwareMetrics.hardnessGm} Gm</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Table: All 23 Pitch Evaluations Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Complete Camp Surface Evaluation Matrix ({filteredEvals.length} Sessions)
            </h3>
            <p className="text-xs text-slate-400">
              Click <strong>Set Primary</strong> or <strong>Set Compare</strong> on any row to compare
              any two evaluations side-by-side.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'NTC', 'STADIUM'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setVenueFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  venueFilter === f
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {f === 'ALL' ? 'All Evaluations (23)' : f === 'NTC' ? 'NTC Training (18)' : 'Match Stadiums (5)'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Pitch / Stadium</th>
                <th className="py-2.5 px-2">Objective</th>
                {ALL_INDEX_NAMES.map((m) => (
                  <th key={m} className="py-2.5 px-2 text-right">
                    {m}
                  </th>
                ))}
                <th className="py-2.5 px-2 text-right">Hardness</th>
                <th className="py-2.5 px-2 text-center">Boot Rec</th>
                <th className="py-2.5 px-3 text-right">Compare Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEvals.map((ev) => {
                const isPrim = ev.id === selectedPrimaryId;
                const isComp = ev.id === selectedCompareId;
                const bootRec = getBootRecommendation(
                  ev.averages.Boot,
                  ev.hardwareMetrics.studDepthMm,
                  ev.averages.Grip
                );
                return (
                  <tr
                    key={ev.id}
                    className={`transition-colors ${
                      isPrim
                        ? 'bg-emerald-500/10'
                        : isComp
                        ? 'bg-sky-500/10'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">{ev.date}</td>
                    <td className="py-2.5 px-3 font-sans font-bold text-white whitespace-nowrap">
                      {ev.pitchName}
                    </td>
                    <td className="py-2.5 px-2 font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {ev.sessionObjective}
                      </span>
                    </td>
                    {ALL_INDEX_NAMES.map((m) => (
                      <td
                        key={m}
                        className={`py-2.5 px-2 text-right ${
                          m === 'Impact' || m === 'Energy' || m === 'Grip'
                            ? 'font-bold text-white'
                            : 'text-slate-300'
                        }`}
                      >
                        {ev.averages[m].toFixed(2)}
                      </td>
                    ))}
                    <td className="py-2.5 px-2 text-right text-amber-300">
                      {ev.hardwareMetrics.hardnessGm} Gm
                    </td>
                    <td className="py-2.5 px-2 text-center font-sans">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${bootRec.badgeBg}`}>
                        {bootRec.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-sans">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectPrimary(ev.id)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                            isPrim
                              ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-emerald-500/50'
                          }`}
                        >
                          {isPrim ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Pitch A
                            </span>
                          ) : (
                            'Set Pitch A'
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onSelectCompare(ev.id)}
                          className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors ${
                            isComp
                              ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-sky-500/50'
                          }`}
                        >
                          {isComp ? 'Pitch B' : 'Set Pitch B'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
