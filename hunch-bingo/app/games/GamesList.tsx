"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { createGame, deleteGame } from "./actions";
import type { Game, ExternalEvent } from "@/app/generated/prisma";
import { Plus, Trash2, ArrowRight, Trophy } from "lucide-react";
import { DateTimePicker } from "@/components/ui/date-time-picker";

type GameWithEvent = Game & { event: ExternalEvent };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PENDING: "Pending", OPEN: "Open", CLOSED: "Closed", COMPLETED: "Completed",
};
const STATUS_VARIANTS: Record<string, "draft"|"pending"|"open"|"closed"|"completed"> = {
  DRAFT: "draft", PENDING: "pending", OPEN: "open", CLOSED: "closed", COMPLETED: "completed",
};

function CreateGameDialog({ events, onClose }: { events: ExternalEvent[]; onClose: () => void }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try { await createGame(fd); onClose(); }
      catch (err) { setError(err instanceof Error ? err.message : "Error creating game"); }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-6 py-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Game Name</Label>
          <Input id="name" name="name" placeholder="e.g. Liverpool UCL Round 1" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="eventId">Event</Label>
          {events.length === 0 ? (
            <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
              No events registered.{" "}
              <Link href="/events" className="text-indigo-600 font-semibold hover:underline">Add one first →</Link>
            </p>
          ) : (
            <select name="eventId" required
              className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm transition-all focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15">
              <option value="">Select an event…</option>
              {events.map(ev => (
                <option key={ev.id} value={ev.id}>{ev.name}</option>
              ))}
            </select>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Open Time</Label>
            <DateTimePicker value={openTime} onChange={setOpenTime} placeholder="Pick open time…" />
            <input type="hidden" name="openTime" value={openTime} />
          </div>
          <div className="space-y-2">
            <Label>Close Time</Label>
            <DateTimePicker value={closeTime} onChange={setCloseTime} placeholder="Pick close time…" />
            <input type="hidden" name="closeTime" value={closeTime} />
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl overflow-hidden">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={pending || events.length === 0}>
          {pending ? "Creating…" : "Create Game"}
        </Button>
      </div>
    </form>
  );
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export function GamesList({ games, events }: { games: GameWithEvent[]; events: ExternalEvent[] }) {
  const [createOpen, setCreateOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleDelete(id: number) {
    if (!confirm("Delete this game?")) return;
    startTransition(() => deleteGame(id));
  }

  return (
    <div className="animate-enter">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Games</h1>
          <p className="text-sm text-slate-500 mt-1">Simulation rounds tied to real sport events</p>
        </div>
        <div className="flex items-center gap-3">
          {games.length > 0 && (
            <span className="text-sm text-slate-400 font-semibold tabular-nums hidden sm:block">
              {games.length} {games.length === 1 ? "game" : "games"}
            </span>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New Game</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Game</DialogTitle>
              </DialogHeader>
              <CreateGameDialog events={events} onClose={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Empty state */}
      {games.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Trophy className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">No games yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Create your first game to get started</p>
          </div>
        </div>
      )}

      {/* Desktop table */}
      {games.length > 0 && (
        <div className="hidden sm:block rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Name</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Event</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Opens</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Closes</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {games.map((g, i) => (
                <tr key={g.id}
                  className="hover:bg-slate-50/70 transition-colors duration-100 group animate-enter"
                  style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{g.name}</td>
                  <td className="px-5 py-3.5 text-slate-500 text-sm">{g.event.name}</td>
                  <td className="px-5 py-3.5">
                    <Badge variant={STATUS_VARIANTS[g.status]}>{STATUS_LABELS[g.status]}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs font-mono tabular-nums">
                    {fmt(g.openTime)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs font-mono tabular-nums">
                    {fmt(g.closeTime)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/games/${g.id}`}>
                          View <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(g.id)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile card list */}
      {games.length > 0 && (
        <div className="sm:hidden space-y-2">
          {games.map((g, i) => (
            <div key={g.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-enter"
              style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{g.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{g.event.name}</p>
                </div>
                <Badge variant={STATUS_VARIANTS[g.status]} className="shrink-0">
                  {STATUS_LABELS[g.status]}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 font-mono tabular-nums mb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest not-font-mono block mb-0.5">Opens</span>
                  {fmt(g.openTime)}
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest not-font-mono block mb-0.5">Closes</span>
                  {fmt(g.closeTime)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild className="flex-1">
                  <Link href={`/games/${g.id}`}>
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(g.id)}
                  className="text-slate-400 hover:text-red-600 hover:bg-red-50 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
