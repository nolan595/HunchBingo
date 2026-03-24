"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { OddsDifficulty, Segment } from "@/app/generated/prisma";
import type { SquareInput } from "./actions";

type SquareState = { marketId: string; difficultyId: string };
const EMPTY: SquareState = { marketId: "", difficultyId: "" };

const POSITION_LABELS = [
  "Top-left", "Top-center", "Top-right",
  "Mid-left", "Center",     "Mid-right",
  "Bot-left", "Bot-center", "Bot-right",
];

// Cycling colour palette for segment cards
const PALETTE = [
  { base: "border-emerald-200 bg-emerald-50 text-emerald-900", active: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/40" },
  { base: "border-amber-200 bg-amber-50 text-amber-900",       active: "border-amber-500 bg-amber-50 ring-2 ring-amber-400/40" },
  { base: "border-rose-200 bg-rose-50 text-rose-900",          active: "border-rose-500 bg-rose-50 ring-2 ring-rose-400/40" },
  { base: "border-indigo-200 bg-indigo-50 text-indigo-900",    active: "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-400/40" },
  { base: "border-violet-200 bg-violet-50 text-violet-900",    active: "border-violet-500 bg-violet-50 ring-2 ring-violet-400/40" },
  { base: "border-sky-200 bg-sky-50 text-sky-900",             active: "border-sky-500 bg-sky-50 ring-2 ring-sky-400/40" },
];

type Props = {
  difficulties: OddsDifficulty[];
  segments: Segment[];
  defaultName?: string;
  defaultSegmentId?: number | null;
  defaultSquares?: Array<{ marketId: number; difficultyId: number }>;
  onSubmit: (name: string, squares: SquareInput[], segmentId: number | null) => Promise<void>;
  submitLabel?: string;
};

export function SheetBuilder({
  difficulties,
  segments,
  defaultName = "",
  defaultSegmentId = null,
  defaultSquares,
  onSubmit,
  submitLabel = "Create Sheet",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(defaultName);
  const [segmentId, setSegmentId] = useState<number | null>(defaultSegmentId);
  const [squares, setSquares] = useState<SquareState[]>(
    defaultSquares
      ? defaultSquares.map(s => ({
          marketId: String(s.marketId),
          difficultyId: String(s.difficultyId),
        }))
      : Array.from({ length: 9 }, () => ({ ...EMPTY }))
  );
  const [error, setError] = useState("");

  function updateSquare(index: number, field: keyof SquareState, value: string) {
    setSquares(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const marketIds = squares.map(s => s.marketId.trim()).filter(Boolean);
    if (marketIds.length !== 9)        { setError("All 9 squares must have a Market ID"); return; }
    if (squares.some(s => !s.difficultyId)) { setError("All 9 squares must have a difficulty"); return; }
    if (new Set(marketIds).size !== 9) { setError("Market IDs must be unique across all squares"); return; }

    startTransition(async () => {
      try {
        await onSubmit(name, squares.map((s, i) => ({
          position: i + 1,
          marketId: parseInt(s.marketId),
          difficultyId: parseInt(s.difficultyId),
        })), segmentId);
        router.push("/bingo-sheets");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error saving sheet");
      }
    });
  }

  const filledCount = squares.filter(s => s.marketId.trim() && s.difficultyId).length;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4 sm:space-y-6">
      {/* Sheet name */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="space-y-2">
          <Label htmlFor="name">Sheet Name</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Sheet A – Low Risk"
            required
          />
        </div>
      </div>

      {/* Segment selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Player Segment</p>
        {segments.length === 0 ? (
          <p className="text-sm text-slate-500">
            No segments defined yet.{" "}
            <a href="/segments" className="text-indigo-600 font-semibold hover:underline">Create one →</a>
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {segments.map((seg, i) => {
                const colors = PALETTE[i % PALETTE.length];
                const active = segmentId === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setSegmentId(active ? null : seg.id)}
                    className={`rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all duration-150 focus:outline-none ${
                      active ? colors.active : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {seg.name}
                  </button>
                );
              })}
            </div>
            {!segmentId && (
              <p className="text-[11px] text-slate-400 mt-2">Optional — leave unset to apply to all players</p>
            )}
          </>
        )}
      </div>

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grid (3×3)</p>
          <span className="text-[11px] font-bold tabular-nums text-slate-400">{filledCount}/9 filled</span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {squares.map((sq, i) => {
            const filled = sq.marketId.trim() && sq.difficultyId;
            return (
              <div
                key={i}
                className={`rounded-xl border-2 p-2 sm:p-3 space-y-2 transition-all duration-150 ${
                  filled
                    ? "border-indigo-200 bg-indigo-50/40"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sq {i + 1}</p>
                <Input
                  type="number"
                  min={1}
                  value={sq.marketId}
                  onChange={e => updateSquare(i, "marketId", e.target.value)}
                  placeholder="Market ID"
                  className="h-7 sm:h-8 text-xs sm:text-sm font-mono font-bold tabular-nums px-2"
                />
                <Select value={sq.difficultyId} onValueChange={v => updateSquare(i, "difficultyId", v)}>
                  <SelectTrigger className="h-7 sm:h-8 text-[11px] sm:text-xs px-2">
                    <SelectValue placeholder="Diff…" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map(d => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}{" "}
                        <span className="text-slate-400 font-mono">
                          ({d.oddsMin}–{d.oddsMax})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="shrink-0 mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/bingo-sheets")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
