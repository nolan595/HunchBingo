"use client";

import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import { getEventsByDate, registerEvent, deleteEvent } from "./actions";
import type { ExternalEvent } from "@/app/generated/prisma";
import type { EventsByDateItem } from "@/lib/offer-api";
import {
  Search,
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

type Props = { registeredEvents: ExternalEvent[] };

function parseTeams(item: EventsByDateItem): { home: string; away: string } {
  if (item.homeTeamName && item.awayTeamName) {
    return { home: item.homeTeamName, away: item.awayTeamName };
  }
  const name = item.matchName;
  for (const sep of ["·", " - ", " vs "]) {
    const idx = name.indexOf(sep);
    if (idx !== -1) {
      return {
        home: name.slice(0, idx).trim(),
        away: name.slice(idx + sep.length).trim(),
      };
    }
  }
  return { home: name, away: "—" };
}

function Toggle({
  active,
  onChange,
  disabled,
}: {
  active: boolean;
  onChange: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none disabled:opacity-40 disabled:cursor-not-allowed",
        active ? "bg-green-500" : "bg-zinc-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
          active ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

function PageButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded border border-zinc-200 bg-white text-zinc-400 hover:bg-zinc-50 hover:text-zinc-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

export function EventsManager({ registeredEvents }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [events, setEvents] = useState<EventsByDateItem[]>([]);
  const [loading, startLoad] = useTransition();
  const [toggling, setToggling] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const [activeIds, setActiveIds] = useState<Set<string>>(
    () => new Set(registeredEvents.map((e) => e.externalEventId))
  );

  const registeredMap = useMemo(
    () =>
      new Map<string, number>(
        registeredEvents.map((e) => [e.externalEventId, e.id])
      ),
    [registeredEvents]
  );

  const filtered = useMemo(
    () =>
      events.filter((e) =>
        e.matchName.toLowerCase().includes(search.toLowerCase())
      ),
    [events, search]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageEvents = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const from = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, filtered.length);

  // Reset page when search changes
  useEffect(() => setPage(0), [search]);

  const fetchEvents = useCallback((d: string) => {
    setError("");
    setPage(0);
    startLoad(async () => {
      try {
        const data = await getEventsByDate(d);
        setEvents(data);
      } catch {
        setError("Failed to load events from Offer API");
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-load on mount
  useEffect(() => {
    fetchEvents(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleToggle(event: EventsByDateItem) {
    const externalId = String(event.eventId);
    const isActive = activeIds.has(externalId);
    const dbId = registeredMap.get(externalId);

    setToggling((prev) => new Set([...prev, event.eventId]));

    // Optimistic update
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (isActive) next.delete(externalId);
      else next.add(externalId);
      return next;
    });

    try {
      if (isActive && dbId !== undefined) {
        await deleteEvent(dbId);
        registeredMap.delete(externalId);
      } else {
        await registerEvent(externalId, event.matchName);
      }
    } catch {
      // Revert on failure
      setActiveIds((prev) => {
        const next = new Set(prev);
        if (isActive) next.add(externalId);
        else next.delete(externalId);
        return next;
      });
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(event.eventId);
        return next;
      });
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Events</h1>
        <p className="text-sm text-zinc-500 mt-1">Soccer matches · sport type 5</p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-zinc-100">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search event"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm border border-zinc-200 rounded-lg bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 pl-3 pr-9 text-sm border border-zinc-200 rounded-lg bg-white text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-200 cursor-pointer"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          </div>
          <button
            onClick={() => fetchEvents(date)}
            disabled={loading}
            className="h-9 px-4 text-sm font-medium rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors flex items-center gap-1.5"
          >
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Search
          </button>
        </div>

        {/* Table body */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-zinc-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading matches…
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-400">
            <Calendar className="h-10 w-10 text-zinc-200" />
            <p className="text-sm">No soccer matches found for this date</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100">
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">
                  Event name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">
                  Home Team name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">
                  Away Team name
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">
                  Start Date
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-400">
                  Tournament name
                </th>
                <th className="px-4 py-3 text-xs font-medium text-zinc-400 text-right">
                  Select for the game
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {pageEvents.map((e) => {
                const { home, away } = parseTeams(e);
                const isActive = activeIds.has(String(e.eventId));
                const isToggling = toggling.has(e.eventId);
                return (
                  <tr
                    key={e.eventId}
                    className="hover:bg-zinc-50/60 transition-colors"
                  >
                    <td className="px-4 py-3 text-zinc-800">{e.matchName}</td>
                    <td className="px-4 py-3 text-zinc-600">{home}</td>
                    <td className="px-4 py-3 text-zinc-600">{away}</td>
                    <td className="px-4 py-3 text-zinc-600 whitespace-nowrap">
                      {new Date(e.matchDate).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {e.tournamentName ?? (
                        <span className="text-zinc-300">ID: {e.tournamentId}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <Toggle
                          active={isActive}
                          disabled={isToggling}
                          onChange={() => handleToggle(e)}
                        />
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
          <div className="flex items-center justify-center gap-1.5 px-4 py-3 border-t border-zinc-100">
            <PageButton onClick={() => setPage(0)} disabled={page === 0}>
              <ChevronsLeft className="h-3 w-3" />
            </PageButton>
            <PageButton
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-3 w-3" />
            </PageButton>
            <span className="px-3 text-sm text-zinc-500 select-none">
              {from} – {to} of {filtered.length}
            </span>
            <PageButton
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-3 w-3" />
            </PageButton>
            <PageButton
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronsRight className="h-3 w-3" />
            </PageButton>
          </div>
        )}
      </div>
    </div>
  );
}
