"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import { getEventsByDate, registerEvent, deleteEvent } from "./actions";
import type { ExternalEvent } from "@/app/generated/prisma";
import type { EventsByDateItem } from "@/lib/offer-api";
import {
  Search, Loader2, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
type Props = { registeredEvents: ExternalEvent[] };

function parseTeams(item: EventsByDateItem): { home: string; away: string } {
  if (item.homeTeamName && item.awayTeamName) return { home: item.homeTeamName, away: item.awayTeamName };
  const name = item.matchName;
  for (const sep of ["·", " - ", " vs "]) {
    const idx = name.indexOf(sep);
    if (idx !== -1) return { home: name.slice(0, idx).trim(), away: name.slice(idx + sep.length).trim() };
  }
  return { home: name, away: "—" };
}

function Toggle({ active, onChange, disabled }: { active: boolean; onChange: () => void; disabled: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={active} disabled={disabled} onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 disabled:opacity-40 disabled:cursor-not-allowed",
        active ? "bg-emerald-500" : "bg-slate-200 hover:bg-slate-300"
      )}>
      <span className={cn(
        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
        active ? "translate-x-4" : "translate-x-0"
      )} />
    </button>
  );
}

function PageButton({ onClick, disabled, children }: { onClick: () => void; disabled: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-100 shadow-sm active:scale-95">
      {children}
    </button>
  );
}

export function EventsManager({ registeredEvents }: Props) {
  const [date, setDate]         = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch]     = useState("");
  const [page, setPage]         = useState(0);
  const [events, setEvents]     = useState<EventsByDateItem[]>([]);
  const [loading, startLoad]    = useTransition();
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [error, setError]       = useState("");

  const [activeIds, setActiveIds] = useState<Set<string>>(
    () => new Set(registeredEvents.map(e => e.externalEventId))
  );
  const registeredMap = useMemo(
    () => new Map<string, number>(registeredEvents.map(e => [e.externalEventId, e.id])),
    [registeredEvents]
  );

  const filtered   = useMemo(() => events.filter(e => e.matchName.toLowerCase().includes(search.toLowerCase())), [events, search]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEvents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const to   = Math.min((page + 1) * PAGE_SIZE, filtered.length);

  useEffect(() => setPage(0), [search]);

  const fetchEvents = useCallback((d: string) => {
    setError(""); setPage(0);
    startLoad(async () => {
      try { setEvents(await getEventsByDate(d)); }
      catch { setError("Failed to load events from Offer API"); }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchEvents(date); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggle(event: EventsByDateItem) {
    const externalId = String(event.eventId);
    const isActive = activeIds.has(externalId);
    const dbId = registeredMap.get(externalId);
    setToggling(prev => new Set([...prev, event.eventId]));
    setActiveIds(prev => { const n = new Set(prev); isActive ? n.delete(externalId) : n.add(externalId); return n; });
    try {
      if (isActive && dbId !== undefined) { await deleteEvent(dbId); registeredMap.delete(externalId); }
      else await registerEvent(externalId, event.matchName);
    } catch {
      setActiveIds(prev => { const n = new Set(prev); isActive ? n.add(externalId) : n.delete(externalId); return n; });
    } finally {
      setToggling(prev => { const n = new Set(prev); n.delete(event.eventId); return n; });
    }
  }

  const activeCount = activeIds.size;

  return (
    <div className="animate-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Events</h1>
          <p className="text-sm text-slate-500 mt-1">Soccer matches · sport type 5</p>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-bold text-emerald-700 tabular-nums">{activeCount} active</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-slate-50/80">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Search event…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 transition-all" />
          </div>
          <label className="relative flex h-9 items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3 shadow-sm transition-all duration-150 cursor-pointer hover:border-slate-300 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/15">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0 pointer-events-none" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="text-sm text-slate-700 font-medium bg-transparent border-none outline-none cursor-pointer w-28" />
          </label>
          <button onClick={() => fetchEvents(date)} disabled={loading}
            className="h-9 px-4 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98]">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Search
          </button>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex items-center justify-center gap-2.5 py-20 text-slate-400 text-sm font-medium">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading matches…
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">No matches found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try a different date or search term</p>
            </div>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                {["Event", "Home", "Away", "Start", "Tournament", ""].map((h, i) => (
                  <th key={i} className={cn(
                    "px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400",
                    i === 5 ? "text-right" : "text-left"
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageEvents.map((e, i) => {
                const { home, away } = parseTeams(e);
                const isActive   = activeIds.has(String(e.eventId));
                const isToggling = toggling.has(e.eventId);
                return (
                  <tr key={e.eventId}
                    className="hover:bg-slate-50/70 transition-colors duration-100 animate-enter"
                    style={{ animationDelay: `${i * 20}ms` }}>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 max-w-[180px] truncate">{e.matchName}</td>
                    <td className="px-4 py-3.5 text-slate-600">{home}</td>
                    <td className="px-4 py-3.5 text-slate-600">{away}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs font-mono tabular-nums whitespace-nowrap">
                      {new Date(e.matchDate).toLocaleString("en-GB", {
                        day:"numeric", month:"short", hour:"2-digit", minute:"2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs max-w-[140px] truncate">
                      {e.tournamentName ?? <span className="text-slate-400 font-mono">#{e.tournamentId}</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-end">
                        <Toggle active={isActive} disabled={isToggling} onChange={() => handleToggle(e)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50/80">
            <PageButton onClick={() => setPage(0)}           disabled={page === 0}><ChevronsLeft  className="h-3 w-3" /></PageButton>
            <PageButton onClick={() => setPage(p => p - 1)} disabled={page === 0}><ChevronLeft   className="h-3 w-3" /></PageButton>
            <span className="px-3 text-xs text-slate-500 select-none font-mono font-semibold tabular-nums">
              {from}–{to} <span className="text-slate-400">of</span> {filtered.length}
            </span>
            <PageButton onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}><ChevronRight  className="h-3 w-3" /></PageButton>
            <PageButton onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1}><ChevronsRight className="h-3 w-3" /></PageButton>
          </div>
        )}
      </div>
    </div>
  );
}
