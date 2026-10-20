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
    { name: 'USSF Super 3', color: '#001489', stroke: '#001489' },
    { name: 'USSF Super 4', color: '#059669', stroke: '#059669' },
    { name: 'USSF Super 5', color: '#C69214', stroke: '#C69214' },
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
        <div
          className="xl:col-span-7 bg-white border border-[#E2E8F0] rounded-[10px] p-5"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E5E9F0]">
            <div>
              <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#C69214]" />
                NTC Longitudinal Surface Evolution (Sept 2 → Sept 28)
              </h3>
              <p className="text-xs text-[#64748B] font-medium">
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
                    className={`px-2.5 py-1 rounded-[6px] text-xs border transition-all ${
                      trendMetric === m
                        ? 'bg-[#001489] text-white border-[#C69214] font-extrabold shadow-sm'
                        : 'bg-[#F8F9FA] text-[#434C5E] border-[#CBD5E1] font-semibold hover:border-[#C69214]'
                    }`}
                  >
                    {m}
                  </button>
                )
              )}
            </div>
          </div>

          {/* SVG Line Chart */}
          <div className="w-full overflow-x-auto bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] p-2">
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
                      stroke="#CBD5E1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-[#64748B] text-[10px] font-mono font-bold"
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
                      stroke="#E2E8F0"
                    />
                    <text
                      x={x}
                      y={h - 10}
                      textAnchor="middle"
                      className="fill-[#2E3440] text-[11px] font-bold"
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
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                        <text
                          x={p.x}
                          y={p.y - 9}
                          textAnchor="middle"
                          className="fill-[#2E3440] text-[10px] font-mono font-extrabold"
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

          <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-[#E5E9F0] text-xs">
            <div className="flex items-center gap-4">
              {pitchSeries.map((s) => (
                <span key={s.name} className="flex items-center gap-1.5 font-extrabold text-[#2E3440]">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </span>
              ))}
            </div>
            <span className="text-[#64748B] font-medium">
              Tip: Click any data node on the trend line to load that evaluation into Pitch A.
            </span>
          </div>
        </div>

        {/* Right 5 Cols: Match Day Stadium Tour Progression (Orlando -> St. Louis -> Arizona -> Minnesota) */}
        <div
          className="xl:col-span-5 bg-white border border-[#E2E8F0] rounded-[10px] p-5 flex flex-col justify-between"
          style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
        >
          <div>
            <div className="pb-3 mb-4 border-b border-[#E5E9F0]">
              <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
                <Award className="w-5 h-5 text-[#C69214]" />
                Match Day Stadium Tour vs. NTC Baseline
              </h3>
              <p className="text-xs text-[#64748B] font-medium">
                Comparing the 5 away/match stadium evaluations against the NTC Camp Composite (Impact
                4.34 | Energy 4.04 | Grip 6.33)
              </p>
            </div>

            <div className="space-y-2.5">
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
                    className={`cursor-pointer p-3.5 rounded-[8px] border transition-all ${
                      isPrimary
                        ? 'bg-[#EFF6FF] border-[1.5px] border-[#001489] shadow-sm'
                        : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#C69214]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-[#C69214] font-extrabold">
                          {st.date} • {st.sessionObjective}
                        </span>
                        <h4 className="text-sm font-extrabold text-[#2E3440]">{st.pitchName}</h4>
                      </div>
                      <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded border ${bootRec.badgeBg}`}>
                        {bootRec.code} ({st.hardwareMetrics.studDepthMm}mm)
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs font-mono mt-2 pt-2 border-t border-[#E2E8F0]">
                      <div>
                        <span className="text-[10px] text-[#64748B] font-sans font-bold block">Impact</span>
                        <strong className={st.averages.Impact > 6.0 ? 'text-[#DA291C]' : 'text-[#2E3440]'}>
                          {st.averages.Impact.toFixed(2)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] font-sans font-bold block">Energy</span>
                        <strong className="text-emerald-700">{st.averages.Energy.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] font-sans font-bold block">Grip</span>
                        <strong className="text-[#001489]">{st.averages.Grip.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#64748B] font-sans font-bold block">Hardness</span>
                        <strong className="text-[#92400E]">{st.hardwareMetrics.hardnessGm} Gm</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Table: All 23 Pitch Evaluations Matrix (mnt-data-management session-crud-table style) */}
      <div
        className="bg-white border border-[#E2E8F0] rounded-[10px] p-5"
        style={{ boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#E5E9F0]">
          <div>
            <h3 className="text-lg font-extrabold text-[#2E3440] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#C69214]" />
              Complete Camp Surface Evaluation Matrix ({filteredEvals.length} Sessions)
            </h3>
            <p className="text-xs text-[#64748B] font-medium">
              Click <strong>Set Pitch A</strong> or <strong>Set Pitch B</strong> on any row to compare
              any two evaluations side-by-side.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {(['ALL', 'NTC', 'STADIUM'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setVenueFilter(f)}
                className={`px-3 py-1.5 rounded-[7px] text-xs border transition-all ${
                  venueFilter === f
                    ? 'bg-[#EFF6FF] text-[#001489] border-[1.5px] border-[#001489] font-extrabold'
                    : 'bg-[#F8F9FA] text-[#434C5E] border-[#CBD5E1] font-semibold hover:border-[#C69214]'
                }`}
              >
                {f === 'ALL' ? 'All Evaluations (23)' : f === 'NTC' ? 'NTC Training (18)' : 'Match Stadiums (5)'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto border border-[#E2E8F0] rounded-[8px]">
          <table className="session-crud-table text-left">
            <thead>
              <tr>
                <th>Date</th>
                <th>Pitch / Stadium</th>
                <th>Objective</th>
                {ALL_INDEX_NAMES.map((m) => (
                  <th key={m} className="text-right">
                    {m}
                  </th>
                ))}
                <th className="text-right">Hardness</th>
                <th className="text-center">Boot Rec</th>
                <th className="text-right">Compare Actions</th>
              </tr>
            </thead>
            <tbody className="font-mono">
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
                        ? 'bg-[#EFF6FF]'
                        : isComp
                        ? 'bg-[#FEF3C7]/45'
                        : ''
                    }`}
                  >
                    <td className="whitespace-nowrap text-[#434C5E] font-semibold">{ev.date}</td>
                    <td className="font-sans font-extrabold text-[#2E3440] whitespace-nowrap">
                      {ev.pitchName}
                    </td>
                    <td className="font-sans">
                      <span className="px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#E2E8F0] text-[#434C5E] text-[11px] font-bold">
                        {ev.sessionObjective}
                      </span>
                    </td>
                    {ALL_INDEX_NAMES.map((m) => (
                      <td
                        key={m}
                        className={`text-right ${
                          m === 'Impact' || m === 'Energy' || m === 'Grip'
                            ? 'font-extrabold text-[#001489]'
                            : 'text-[#434C5E]'
                        }`}
                      >
                        {ev.averages[m].toFixed(2)}
                      </td>
                    ))}
                    <td className="text-right font-bold text-[#92400E]">
                      {ev.hardwareMetrics.hardnessGm} Gm
                    </td>
                    <td className="text-center font-sans">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${bootRec.badgeBg}`}>
                        {bootRec.code}
                      </span>
                    </td>
                    <td className="text-right whitespace-nowrap font-sans">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectPrimary(ev.id)}
                          className={`px-2.5 py-1 rounded-[6px] text-[11px] border transition-all ${
                            isPrim
                              ? 'bg-[#001489] text-white border-[#001489] font-extrabold'
                              : 'bg-[#F8F9FA] text-[#2E3440] border-[#CBD5E1] font-bold hover:border-[#001489]'
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
                          className={`px-2.5 py-1 rounded-[6px] text-[11px] border transition-all ${
                            isComp
                              ? 'bg-[#C69214] text-white border-[#C69214] font-extrabold'
                              : 'bg-[#F8F9FA] text-[#2E3440] border-[#CBD5E1] font-bold hover:border-[#C69214]'
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
