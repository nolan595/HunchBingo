"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { createDifficulty, updateDifficulty, deleteDifficulty } from "./actions";
import type { OddsDifficulty } from "@/app/generated/prisma";
import { Pencil, Trash2, Plus, Sliders } from "lucide-react";

type Props = { difficulties: OddsDifficulty[] };

function DifficultyForm({
  defaultValues, onSubmit, onClose,
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
      try { await onSubmit(fd); onClose(); }
      catch (err) { setError(err instanceof Error ? err.message : "Error saving"); }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="px-6 py-5 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={defaultValues?.name} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="oddsMin">Odds Min</Label>
            <Input id="oddsMin" name="oddsMin" type="number" step="0.01" defaultValue={defaultValues?.oddsMin} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="oddsMax">Odds Max</Label>
            <Input id="oddsMax" name="oddsMax" type="number" step="0.01" defaultValue={defaultValues?.oddsMax} required />
          </div>
        </div>
        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <span className="shrink-0 mt-0.5">⚠</span>
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="flex justify-end gap-2 px-6 py-4 bg-slate-50 border-t border-slate-100">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
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
    <div className="animate-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Difficulties</h1>
          <p className="text-sm text-slate-500 mt-1">Define odds ranges for bingo square difficulty tiers</p>
        </div>
        <div className="flex items-center gap-3">
          {difficulties.length > 0 && (
            <span className="text-sm text-slate-400 font-semibold tabular-nums">
              {difficulties.length} {difficulties.length === 1 ? "tier" : "tiers"}
            </span>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New Difficulty</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Difficulty Tier</DialogTitle></DialogHeader>
              <DifficultyForm onSubmit={createDifficulty} onClose={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Empty state */}
      {difficulties.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
            <Sliders className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">No difficulty tiers yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Add tiers to define odds ranges for squares</p>
          </div>
        </div>
      )}

      {/* Desktop table */}
      {difficulties.length > 0 && (
        <div className="hidden sm:block rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Name</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Odds Range</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {difficulties.map((d, i) => (
                <tr key={d.id}
                  className="hover:bg-slate-50/70 transition-colors duration-100 group animate-enter"
                  style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{d.name}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-slate-700 tabular-nums">{d.oddsMin.toFixed(2)}</span>
                      <span className="text-slate-300 text-xs">→</span>
                      <span className="font-mono text-sm font-semibold text-slate-700 tabular-nums">{d.oddsMax.toFixed(2)}</span>
                      <span className="ml-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 tabular-nums">
                        ×{((d.oddsMin + d.oddsMax) / 2).toFixed(2)} avg
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs font-mono font-semibold tabular-nums">
                    {new Date(d.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      <Button size="icon" variant="ghost" onClick={() => setEditTarget(d)}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id)}
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
      {difficulties.length > 0 && (
        <div className="sm:hidden space-y-2">
          {difficulties.map((d, i) => (
            <div key={d.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-enter"
              style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-slate-900">{d.name}</p>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditTarget(d)}
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 h-8 w-8">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(d.id)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono text-sm font-semibold text-slate-700 tabular-nums">{d.oddsMin.toFixed(2)}</span>
                <span className="text-slate-300 text-xs">→</span>
                <span className="font-mono text-sm font-semibold text-slate-700 tabular-nums">{d.oddsMax.toFixed(2)}</span>
                <span className="ml-1 text-[10px] font-bold text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 tabular-nums">
                  ×{((d.oddsMin + d.oddsMax) / 2).toFixed(2)} avg
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Difficulty Tier</DialogTitle></DialogHeader>
          {editTarget && (
            <DifficultyForm
              defaultValues={editTarget}
              onSubmit={fd => updateDifficulty(editTarget.id, fd)}
              onClose={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
