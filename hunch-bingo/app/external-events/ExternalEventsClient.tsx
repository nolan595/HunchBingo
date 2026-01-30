"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createSportEvent, deleteSportEventByExternalId } from "@/app/external-events/actions";
import type {
  ExternalEventsResponse,
  ExternalEventRow,
} from "@/lib/types/externalEvents";

function yyyyMmDd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toLocalDateTimeInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

async function fetchExternalEvents(
  startDate: string,
  startDateTime: string,
  page: number
): Promise<ExternalEventRow[]> {
  const res = await fetch(
    `/api/external-events?startDate=${encodeURIComponent(startDate)}&startDateTime=${encodeURIComponent(startDateTime)}&page=${page}`
  );
  if (!res.ok) throw new Error(await res.text().catch(() => "Failed to fetch external events"));
  const data = (await res.json()) as ExternalEventsResponse;
  return data.rows ?? [];
}

export default function ExternalEventsClient() {
  // default to today
  const [startDateTime, setStartDateTime] = useState(() => toLocalDateTimeInputValue(new Date()));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [savingIds, setSavingIds] = useState<Set<number>>(() => new Set());
  const [savedIds, setSavedIds] = useState<Set<number>>(() => new Set());
  const startDate = useMemo(() => startDateTime.slice(0, 10), [startDateTime]);

  const {
    data: availableEvents = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["externalEvents-available", startDate, startDateTime, page],
    queryFn: () => fetchExternalEvents(startDate, startDateTime, page),
    staleTime: 30_000,
  });

  // If/when you later wire Prisma-imported events,
  // you can reintroduce importedIds filtering here.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableEvents;
    return availableEvents.filter((event) => event.matchName.toLowerCase().includes(q));
  }, [availableEvents, search]);

  function resetPaging() {
    setPage(1);
  }

  async function toggleSave(event: ExternalEventRow, checked: boolean) {
    if (!checked) {
      setSavingIds((prev) => new Set(prev).add(event.externalId));
      try {
        await deleteSportEventByExternalId(event.externalId);
      } finally {
        setSavingIds((prev) => {
          const next = new Set(prev);
          next.delete(event.externalId);
          return next;
        });
      }
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(event.externalId);
        return next;
      });
      return;
    }

    setSavingIds((prev) => new Set(prev).add(event.externalId));
    try {
      await createSportEvent({
        name: event.matchName,
        startTimeIso: event.startTimeIso,
        externalId: event.externalId,
      });
      setSavedIds((prev) => new Set(prev).add(event.externalId));
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(event.externalId);
        return next;
      });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">External Events</h1>
        <p className="text-purple-300">
          Browse 10 sporting events from Superbet Offer API by date
        </p>
      </div>

      {/* Date picker row */}
      <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2 text-purple-200">
            <Calendar className="w-4 h-4 text-white" />
            <span className="text-sm">Pick a date to fetch the next 10 events</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => {
                setStartDateTime(e.target.value);
                resetPaging();
              }}
              className="bg-slate-950/60 border border-purple-500/20 rounded-md px-3 py-2 text-sm text-white"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search match"
              className="bg-slate-950/60 border border-purple-500/20 rounded-md px-3 py-2 text-sm text-white"
            />
            <Button
              onClick={() => refetch()}
              className="bg-slate-800/60 hover:bg-slate-800"
              disabled={isFetching}
            >
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="space-y-3">
        <h2 className="text-2xl font-bold text-white">Available Events</h2>

        {error ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="p-6 text-purple-200">
              Couldn’t fetch events for {startDate}. Try another date.
            </CardContent>
          </Card>
        ) : isLoading ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="p-6 text-purple-200">Loading events…</CardContent>
          </Card>
        ) : rows.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="p-6 text-purple-200">No events found.</CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-900/50 border-purple-500/20 backdrop-blur-sm">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-950/50">
                    <tr className="text-left text-purple-200">
                      <th className="px-4 py-3 font-semibold">Match</th>
                      <th className="px-4 py-3 font-semibold">Start Time</th>
                      <th className="px-4 py-3 font-semibold text-right">Use Game</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.map((event) => (
                      <tr
                        key={event.externalId}
                        className="border-t border-purple-500/10 hover:bg-slate-950/30 transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-medium">
                          {event.matchName}
                          <div className="text-xs text-slate-400 font-mono mt-1">
                            ID: {event.externalId}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-purple-200">
                          {format(new Date(event.startTimeIso), "PPp")}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-col items-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                toggleSave(event, !savedIds.has(event.externalId))
                              }
                              disabled={savingIds.has(event.externalId)}
                              aria-pressed={savedIds.has(event.externalId)}
                              aria-label={`Select ${event.matchName}`}
                              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                                savedIds.has(event.externalId)
                                  ? "bg-slate-200/40"
                                  : "bg-slate-200/40"
                              } ${savingIds.has(event.externalId) ? "opacity-60" : ""}`}
                            >
                              <span
                                className={`inline-block h-6 w-6 transform rounded-full shadow transition-transform ${
                                  savedIds.has(event.externalId)
                                    ? "translate-x-5 bg-purple-700"
                                    : "translate-x-1 bg-slate-400"
                                }`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <div className="flex items-center justify-between px-4 py-3 border-t border-purple-500/10">
              <Button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isFetching}
                className="bg-slate-800/60 hover:bg-slate-800"
              >
                Previous
              </Button>
              <span className="text-xs text-slate-400">Page {page}</span>
              <Button
                onClick={() => setPage((p) => p + 1)}
                disabled={rows.length < 10 || isFetching}
                className="bg-slate-800/60 hover:bg-slate-800"
              >
                Next
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
