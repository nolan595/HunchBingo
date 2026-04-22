export const dynamic = "force-dynamic";

import Link from "next/link";
import { TrendingUp, BarChart2, Target, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import {
  getSheetPerformance,
  getWeeklyPerformance,
  getMarketStats,
  getDifficultyStats,
} from "@/lib/analytics";

function pct(rate: number) {
  return `${Math.round(rate * 100)}%`;
}

function rateColor(rate: number | null) {
  if (rate === null) return { text: "text-slate-400", bar: "bg-slate-200", cell: "bg-slate-50 text-slate-400" };
  if (rate >= 0.5)  return { text: "text-emerald-600", bar: "bg-emerald-400", cell: "bg-emerald-100 text-emerald-700" };
  if (rate >= 0.33) return { text: "text-amber-600",   bar: "bg-amber-400",   cell: "bg-amber-100 text-amber-700"   };
  return               { text: "text-red-600",      bar: "bg-red-400",     cell: "bg-red-100 text-red-700"       };
}

function TrendIcon({ trend }: { trend: "up" | "down" | "flat" | null }) {
  if (!trend) return <span className="text-slate-300 text-xs">—</span>;
  if (trend === "up")   return <span className="text-emerald-500 font-bold text-sm">↑</span>;
  if (trend === "down") return <span className="text-red-400 font-bold text-sm">↓</span>;
  return <span className="text-slate-400 font-bold text-sm">→</span>;
}

function SectionHead({ label, icon: Icon }: { label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-4 w-4 text-indigo-400 shrink-0" />
      <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</h2>
    </div>
  );
}

function WinRateBar({ rate }: { rate: number | null }) {
  const c = rateColor(rate);
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden shrink-0">
        <div className={cn("h-full rounded-full", c.bar)} style={{ width: rate !== null ? `${Math.round(rate * 100)}%` : "0%" }} />
      </div>
      <span className={cn("text-xs font-bold tabular-nums w-8 text-right", c.text)}>
        {rate !== null ? pct(rate) : "—"}
      </span>
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ segment?: string }>;
}) {
  const params = await searchParams;
  const segmentId = params.segment ? parseInt(params.segment) : undefined;

  const [segments, sheetPerf, weeklyData, marketStats, diffStats] = await Promise.all([
    prisma.segment.findMany({ orderBy: { name: "asc" } }),
    getSheetPerformance(segmentId),
    getWeeklyPerformance(segmentId),
    getMarketStats(),
    getDifficultyStats(),
  ]);

  const { weeks, rows: weeklyRows } = weeklyData;
  // Show at most 8 most recent weeks in the heatmap
  const displayWeeks = weeks.slice(-8);

  const hasData = sheetPerf.length > 0;

  // Build lookup for weekly cells: `${sheetId}::${weekLabel}` → row
  const weeklyLookup = new Map(weeklyRows.map(r => [`${r.sheetId}::${r.weekLabel}`, r]));

  // Unique sheets for the heatmap (deduped from sheetPerf)
  const heatmapSheets = sheetPerf;

  return (
    <div className="space-y-8 animate-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Sheet performance across completed games</p>
      </div>

      {/* Segment filter */}
      {segments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/analytics"
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              !segmentId
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600",
            )}
          >
            All segments
          </Link>
          {segments.map(seg => (
            <Link
              key={seg.id}
              href={`/analytics?segment=${seg.id}`}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                segmentId === seg.id
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600",
              )}
            >
              {seg.name}
            </Link>
          ))}
        </div>
      )}

      {!hasData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">No data yet</h2>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">
            Complete some games to see sheet performance analytics here.
          </p>
          <Link
            href="/games"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
          >
            View Games
          </Link>
        </div>
      )}

      {hasData && (
        <>
          {/* Section 1: Per-sheet performance table */}
          <section>
            <SectionHead label="Sheet Performance" icon={BarChart2} />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sheet</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Segment</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Games</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Connect-3s</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rate</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Avg Lines</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {sheetPerf.map(row => {
                    const c = rateColor(row.connect3Rate);
                    return (
                      <tr key={row.sheetId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-slate-800">{row.sheetName}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          {row.segmentName
                            ? <span className="text-xs bg-slate-100 text-slate-600 rounded-full px-2 py-0.5 font-semibold">{row.segmentName}</span>
                            : <span className="text-xs text-slate-300">—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-mono text-slate-700 tabular-nums">{row.totalGames}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right hidden md:table-cell">
                          <span className="text-sm font-mono tabular-nums">
                            <span className={c.text}>{row.connect3Count}</span>
                            <span className="text-slate-300">/{row.totalGames}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <WinRateBar rate={row.connect3Rate} />
                        </td>
                        <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                          <span className="text-sm font-mono text-slate-600 tabular-nums">{row.avgScore.toFixed(1)}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center hidden md:table-cell">
                          <TrendIcon trend={row.trend} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2: Week-over-week heatmap */}
          {displayWeeks.length > 0 && (
            <section>
              <SectionHead label="Week-over-Week" icon={TrendingUp} />
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[160px]">Sheet</th>
                      {displayWeeks.map(wk => (
                        <th key={wk} className="px-3 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[72px]">
                          {wk.replace(/^(\d{4})-/, "$1 ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {heatmapSheets.map(row => (
                      <tr key={row.sheetId} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-slate-800 whitespace-nowrap">{row.sheetName}</p>
                          {row.segmentName && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{row.segmentName}</p>
                          )}
                        </td>
                        {displayWeeks.map(wk => {
                          const cell = weeklyLookup.get(`${row.sheetId}::${wk}`);
                          const c = rateColor(cell ? cell.connect3Rate : null);
                          return (
                            <td key={wk} className="px-3 py-3 text-center">
                              {cell ? (
                                <span className={cn("inline-block rounded-lg px-2 py-1 text-xs font-bold tabular-nums min-w-[40px]", c.cell)}>
                                  {pct(cell.connect3Rate)}
                                  <span className="block text-[9px] font-normal opacity-70">{cell.gamesPlayed}g</span>
                                </span>
                              ) : (
                                <span className="text-slate-200 text-xs">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 px-1">
                Green ≥50% · Amber ≥33% · Red &lt;33% · Numbers show connect-3 rate / games played
              </p>
            </section>
          )}

          {/* Section 3: Market win rates */}
          {marketStats.length > 0 && (
            <section>
              <SectionHead label="Market Win Rates" icon={Target} />
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Market</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Used</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Won</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Lost</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">No Match</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {marketStats.map(m => (
                      <tr key={m.marketId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-slate-800">{m.marketName ?? `Market ${m.marketId}`}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ID {m.marketId}</p>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-mono text-slate-600 tabular-nums">{m.totalUsed}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                          <span className="text-sm font-mono text-emerald-600 tabular-nums">{m.wonCount}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                          <span className="text-sm font-mono text-red-400 tabular-nums">{m.lostCount}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right hidden md:table-cell">
                          <span className="text-sm font-mono text-slate-400 tabular-nums">{m.noMatchCount}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <WinRateBar rate={m.winRate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Section 4: Difficulty win rates */}
          {diffStats.length > 0 && (
            <section>
              <SectionHead label="Difficulty Tier Win Rates" icon={Layers} />
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100">
                      <th className="px-5 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Difficulty</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Odds Range</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Squares</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Won</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Lost</th>
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">No Match</th>
                      <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {diffStats.map(d => (
                      <tr key={d.difficultyId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold text-slate-800">{d.difficultyName}</p>
                        </td>
                        <td className="px-4 py-3.5 hidden sm:table-cell">
                          <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                            {d.oddsMin}–{d.oddsMax}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-sm font-mono text-slate-600 tabular-nums">{d.totalSquares}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                          <span className="text-sm font-mono text-emerald-600 tabular-nums">{d.wonCount}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                          <span className="text-sm font-mono text-red-400 tabular-nums">{d.lostCount}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right hidden md:table-cell">
                          <span className="text-sm font-mono text-slate-400 tabular-nums">{d.noMatchCount}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <WinRateBar rate={d.winRate} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
