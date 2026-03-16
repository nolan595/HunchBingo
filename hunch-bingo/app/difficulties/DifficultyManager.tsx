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
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
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
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Difficulties</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Define odds ranges for bingo square difficulty tiers
          </p>
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

      <div className="rounded-xl border border-white/[0.07] overflow-hidden bg-[#0e1520]/60">
        <table className="w-full text-sm">
          <thead className="border-b border-white/[0.07] bg-black/20">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Odds Min</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Odds Max</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {difficulties.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-slate-600">
                  No difficulty tiers yet
                </td>
              </tr>
            )}
            {difficulties.map((d) => (
              <tr key={d.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 font-medium text-slate-200">{d.name}</td>
                <td className="px-4 py-3 text-slate-400 font-mono">{d.oddsMin.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-400 font-mono">{d.oddsMax.toFixed(2)}</td>
                <td className="px-4 py-3 text-slate-600 text-xs font-mono">
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
