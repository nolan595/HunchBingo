"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createDifficulty, updateDifficulty, deleteDifficulty } from "./actions";
import type { OddsDifficulty } from "@/app/generated/prisma";
import { Pencil, Trash2, Plus } from "lucide-react";

type Props = { difficulties: OddsDifficulty[] };

function DifficultyForm({
  defaultValues,
  onSubmit,
  onClose,
}: {
  defaultValues?: OddsDifficulty;
  onSubmit: (fd: FormData) => Promise<void>;
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
        await onSubmit(fd);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error saving");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="oddsMin">Odds Min</Label>
          <Input
            id="oddsMin"
            name="oddsMin"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.oddsMin}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="oddsMax">Odds Max</Label>
          <Input
            id="oddsMax"
            name="oddsMax"
            type="number"
            step="0.01"
            defaultValue={defaultValues?.oddsMax}
            required
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

export function DifficultyManager({ difficulties }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<OddsDifficulty | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: number) {
    if (!confirm("Delete this difficulty tier?")) return;
    startTransition(() => deleteDifficulty(id));
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Difficulties</h1>
          <p className="text-sm text-zinc-500 mt-1">Define odds ranges for bingo square difficulty tiers</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> New Difficulty
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Difficulty Tier</DialogTitle>
            </DialogHeader>
            <DifficultyForm
              onSubmit={createDifficulty}
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
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Odds Min</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Odds Max</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-600">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {difficulties.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No difficulty tiers yet
                </td>
              </tr>
            )}
            {difficulties.map((d) => (
              <tr key={d.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium">{d.name}</td>
                <td className="px-4 py-3 text-zinc-600">{d.oddsMin.toFixed(2)}</td>
                <td className="px-4 py-3 text-zinc-600">{d.oddsMax.toFixed(2)}</td>
                <td className="px-4 py-3 text-zinc-400">
                  {new Date(d.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditTarget(d)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(d.id)}
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

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Difficulty Tier</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <DifficultyForm
              defaultValues={editTarget}
              onSubmit={(fd) => updateDifficulty(editTarget.id, fd)}
              onClose={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
