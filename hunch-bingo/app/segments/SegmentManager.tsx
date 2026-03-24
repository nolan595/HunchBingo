"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { createSegment, updateSegment, deleteSegment } from "./actions";
import type { Segment } from "@/app/generated/prisma";
import { Pencil, Trash2, Plus, Tag } from "lucide-react";

type Props = { segments: (Segment & { _count: { sheets: number } })[] };

function SegmentForm({
  defaultValues, onSubmit, onClose,
}: {
  defaultValues?: Segment;
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
          <Label htmlFor="name">Segment Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={defaultValues?.name}
            placeholder="e.g. VIP, New Players, High Value"
            required
            autoFocus
          />
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

export function SegmentManager({ segments }: Props) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Segment | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: number, sheetCount: number) {
    const warning = sheetCount > 0
      ? `This segment is assigned to ${sheetCount} sheet${sheetCount === 1 ? "" : "s"}. Those sheets will become unassigned. `
      : "";
    if (!confirm(`${warning}Delete this segment?`)) return;
    startTransition(() => deleteSegment(id));
  }

  return (
    <div className="animate-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Segments</h1>
          <p className="text-sm text-slate-500 mt-1">Player segments that can be assigned to bingo sheets</p>
        </div>
        <div className="flex items-center gap-3">
          {segments.length > 0 && (
            <span className="text-sm text-slate-400 font-semibold tabular-nums">
              {segments.length} {segments.length === 1 ? "segment" : "segments"}
            </span>
          )}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New Segment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Segment</DialogTitle></DialogHeader>
              <SegmentForm onSubmit={createSegment} onClose={() => setCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {segments.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
            <Tag className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">No segments yet</p>
            <p className="text-xs text-slate-400 mt-0.5">Add segments to categorise bingo sheets by player type</p>
          </div>
        </div>
      )}

      {/* Desktop table */}
      {segments.length > 0 && (
        <div className="hidden sm:block rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Name</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Sheets</th>
                <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {segments.map((seg, i) => (
                <tr key={seg.id}
                  className="hover:bg-slate-50/70 transition-colors duration-100 group animate-enter"
                  style={{ animationDelay: `${i * 30}ms` }}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest">
                        <Tag className="h-2.5 w-2.5" />
                        {seg.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-sm font-semibold tabular-nums">
                    {seg._count.sheets}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs font-mono font-semibold tabular-nums">
                    {new Date(seg.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      <Button size="icon" variant="ghost" onClick={() => setEditTarget(seg)}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(seg.id, seg._count.sheets)}
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
      {segments.length > 0 && (
        <div className="sm:hidden space-y-2">
          {segments.map((seg, i) => (
            <div key={seg.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-enter"
              style={{ animationDelay: `${i * 30}ms` }}>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-widest">
                  <Tag className="h-2.5 w-2.5" />
                  {seg.name}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditTarget(seg)}
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 h-8 w-8">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleDelete(seg.id, seg._count.sheets)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-2">
                {seg._count.sheets} {seg._count.sheets === 1 ? "sheet" : "sheets"} assigned
              </p>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editTarget} onOpenChange={o => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Segment</DialogTitle></DialogHeader>
          {editTarget && (
            <SegmentForm
              defaultValues={editTarget}
              onSubmit={fd => updateSegment(editTarget.id, fd)}
              onClose={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
