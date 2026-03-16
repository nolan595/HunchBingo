"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createGame, deleteGame } from "./actions";
import type { Game, ExternalEvent } from "@/app/generated/prisma";
import { Plus, Trash2, ArrowRight } from "lucide-react";

type GameWithEvent = Game & { event: ExternalEvent };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  OPEN: "Open",
  CLOSED: "Closed",
  COMPLETED: "Completed",
};

const STATUS_VARIANTS: Record<
  string,
  "draft" | "pending" | "open" | "closed" | "completed"
> = {
  DRAFT: "draft",
  PENDING: "pending",
  OPEN: "open",
  CLOSED: "closed",
  COMPLETED: "completed",
};

function CreateGameDialog({
  events,
  onClose,
}: {
  events: ExternalEvent[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createGame(fd);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error creating game");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Game Name</Label>
        <Input id="name" name="name" placeholder="e.g. Liverpool UCL Round 1" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="eventId">Event</Label>
        {events.length === 0 ? (
          <p className="text-sm text-slate-500">
            No events registered.{" "}
            <Link href="/events" className="text-blue-400 underline">
              Add one first
            </Link>
          </p>
        ) : (
          <select
            name="eventId"
            required
            className="flex h-9 w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
          >
            <option value="" className="bg-[#0e1520]">Select an event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id} className="bg-[#0e1520]">
                {ev.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="openTime">Open Time</Label>
          <Input id="openTime" name="openTime" type="datetime-local" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="closeTime">Close Time</Label>
          <Input id="closeTime" name="closeTime" type="datetime-local" required />
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || events.length === 0}>
          {pending ? "Creating…" : "Create Game"}
        </Button>
      </div>
    </form>
  );
}

export function GamesList({
  games,
  events,
}: {
  games: GameWithEvent[];
  events: ExternalEvent[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [, startTransition] = useTransition();

  function handleDelete(id: number) {
    if (!confirm("Delete this game?")) return;
    startTransition(() => deleteGame(id));
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Games</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Simulation rounds tied to real sport events
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New Game
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Game</DialogTitle>
            </DialogHeader>
            <CreateGameDialog
              events={events}
              onClose={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-white/[0.07] overflow-hidden bg-[#0e1520]/60">
        <table className="w-full text-sm">
          <thead className="border-b border-white/[0.07] bg-black/20">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Event</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Open</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Close</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {games.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-600">
                  No games yet
                </td>
              </tr>
            )}
            {games.map((g) => (
              <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-slate-200">{g.name}</td>
                <td className="px-4 py-3 text-slate-400">{g.event.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANTS[g.status]}>
                    {STATUS_LABELS[g.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                  {new Date(g.openTime).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                  {new Date(g.closeTime).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" asChild>
                      <Link href={`/games/${g.id}`}>
                        View <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(g.id)}
                      className="text-red-500/60 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
