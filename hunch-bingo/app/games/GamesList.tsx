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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <p className="text-sm text-zinc-500">
            No events registered.{" "}
            <Link href="/events" className="text-blue-600 underline">
              Add one first
            </Link>
          </p>
        ) : (
          <select
            name="eventId"
            required
            className="flex h-9 w-full rounded-md border border-zinc-300 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="">Select an event…</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
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
      {error && <p className="text-sm text-red-600">{error}</p>}
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
          <h1 className="text-2xl font-bold text-zinc-900">Games</h1>
          <p className="text-sm text-zinc-500 mt-1">
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

      <div className="bg-white rounded-lg border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Event</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Open</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Close</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {games.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                  No games yet
                </td>
              </tr>
            )}
            {games.map((g) => (
              <tr key={g.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{g.name}</td>
                <td className="px-4 py-3 text-zinc-600">{g.event.name}</td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANTS[g.status]}>
                    {STATUS_LABELS[g.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
                  {new Date(g.openTime).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">
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
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
