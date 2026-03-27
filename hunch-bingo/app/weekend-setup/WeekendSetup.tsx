"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, CheckSquare, Square, Zap, ArrowRight, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TopTenEvent } from "@/lib/offer-api";
import { createSingleGame, type SingleGameResult } from "./actions";

function fmtKickoff(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function parseTeams(event: TopTenEvent): { home: string; away: string } {
  if (event.homeTeamName && event.awayTeamName) {
    return { home: event.homeTeamName, away: event.awayTeamName };
  }
  const parts = event.matchName.split(/\s+[v–-]\s+/i);
  return parts.length === 2
    ? { home: parts[0].trim(), away: parts[1].trim() }
    : { home: event.matchName, away: "" };
}

type Phase = "idle" | "creating" | "done";

export function WeekendSetup({ initialEvents }: { initialEvents: TopTenEvent[] }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [phase, setPhase] = useState<Phase>("idle");
  const [completed, setCompleted] = useState(0);
  const [total, setTotal] = useState(0);
  const [currentName, setCurrentName] = useState("");
  const [results, setResults] = useState<SingleGameResult[]>([]);

  const toggleAll = () => {
    if (selected.size === initialEvents.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(initialEvents.map(e => e.eventId)));
    }
  };

  const toggle = (eventId: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(eventId) ? next.delete(eventId) : next.add(eventId);
      return next;
    });
  };

  const handleCreate = async () => {
    const fixtures = initialEvents
      .filter(e => selected.has(e.eventId))
      .map(e => ({ eventId: e.eventId, matchName: e.matchName, matchDate: e.matchDate }));

    if (fixtures.length === 0) return;

    setPhase("creating");
    setTotal(fixtures.length);
    setCompleted(0);
    setResults([]);

    for (const fixture of fixtures) {
      setCurrentName(fixture.matchName);
      const result = await createSingleGame(fixture);
      setResults(prev => [...prev, result]);
      setCompleted(prev => prev + 1);
    }

    setPhase("done");
  };

  // Progress / done view
  if (phase === "creating" || phase === "done") {
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    const opened = results.filter(r => r.opened).length;
    const failed = results.filter(r => !r.opened).length;
    const allGood = phase === "done" && failed === 0;

    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-enter">
        {/* Progress header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {phase === "creating"
                ? <Loader2 className="h-4 w-4 text-indigo-500 animate-spin" />
                : allGood
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  : <AlertTriangle className="h-4 w-4 text-amber-500" />}
              <span className="text-sm font-bold text-slate-800">
                {phase === "creating"
                  ? `Creating games… ${completed}/${total}`
                  : `Done — ${opened} game${opened !== 1 ? "s" : ""} created`}
              </span>
            </div>
            <span className="text-sm font-bold tabular-nums text-slate-500">{pct}%</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          {phase === "creating" && currentName && (
            <p className="text-[11px] text-slate-400 mt-2 truncate">
              Processing: <span className="text-slate-600 font-medium">{currentName}</span>
            </p>
          )}
        </div>

        {/* Live results list */}
        {results.length > 0 && (
          <div className="border-t border-slate-100 divide-y divide-slate-50 max-h-72 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-2.5">
                {r.opened
                  ? <span className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                    </span>
                  : <span className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-3 w-3 text-amber-600" />
                    </span>}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                  {r.error && (
                    <p className="text-[11px] text-amber-600 truncate">{r.error}</p>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider shrink-0",
                  r.opened ? "text-emerald-600" : "text-amber-600",
                )}>
                  {r.opened ? "Open" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer — only when done */}
        {phase === "done" && (
          <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">
                {opened} opened · {failed > 0 ? `${failed} pending` : "all prices locked"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setPhase("idle");
                  setSelected(new Set());
                  setResults([]);
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              >
                Create More
              </button>
              <Link
                href="/games"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 transition-all"
              >
                <Trophy className="h-4 w-4" /> View Games <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (initialEvents.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
          <Trophy className="h-6 w-6 text-slate-300" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">No fixtures available</h2>
        <p className="text-sm text-slate-500">
          The top-10 endpoint returned no football fixtures. Try registering events manually.
        </p>
        <Link
          href="/events"
          className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          Register Events
        </Link>
      </div>
    );
  }

  const allSelected = selected.size === initialEvents.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <button
          onClick={toggleAll}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          {allSelected
            ? <CheckSquare className="h-4 w-4 text-indigo-500" />
            : <Square className="h-4 w-4 text-slate-400" />}
          {allSelected ? "Deselect all" : "Select all"}
        </button>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          {selected.size} selected
        </span>
      </div>

      {/* Fixture table */}
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50/80">
            <th className="w-10 px-4 py-2.5" />
            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fixture</th>
            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:table-cell">Tournament</th>
            <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kickoff</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {initialEvents.map((event) => {
            const { home, away } = parseTeams(event);
            const isSelected = selected.has(event.eventId);
            return (
              <tr
                key={event.eventId}
                onClick={() => toggle(event.eventId)}
                className={cn(
                  "cursor-pointer transition-colors",
                  isSelected ? "bg-indigo-50/40 hover:bg-indigo-50/60" : "hover:bg-slate-50",
                )}
              >
                <td className="px-4 py-3.5">
                  {isSelected
                    ? <CheckSquare className="h-4 w-4 text-indigo-500 shrink-0" />
                    : <Square className="h-4 w-4 text-slate-300 shrink-0" />}
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">
                    {away ? `${home} vs ${away}` : home}
                  </p>
                </td>
                <td className="px-4 py-3.5 hidden sm:table-cell">
                  <span className="text-xs text-slate-500">{event.tournamentName ?? "—"}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs font-mono text-slate-600 tabular-nums whitespace-nowrap">
                    {fmtKickoff(event.matchDate)}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Footer action */}
      <div className="flex items-center justify-between px-5 py-4 bg-slate-50/60 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Games open immediately with prices locked. Close time = kickoff.
        </p>
        <button
          onClick={handleCreate}
          disabled={selected.size === 0}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-150 shadow-sm",
            selected.size > 0
              ? "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white hover:from-indigo-400 hover:to-indigo-500 active:scale-[0.98] shadow-[0_1px_2px_rgba(79,70,229,0.4)]"
              : "bg-slate-100 text-slate-400 cursor-not-allowed",
          )}
        >
          <Zap className="h-4 w-4" />
          Create {selected.size} Game{selected.size !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
