"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { OddsDifficulty, SheetSegment } from "@/app/generated/prisma";
import type { SquareInput } from "./actions";

type SquareState = { marketId: string; difficultyId: string };
const EMPTY: SquareState = { marketId: "", difficultyId: "" };

const POSITION_LABELS = [
  "Top-left", "Top-center", "Top-right",
  "Mid-left", "Center",     "Mid-right",
  "Bot-left", "Bot-center", "Bot-right",
];

const SEGMENTS: {
  value: SheetSegment;
  label: string;
  tiers: string;
  description: string;
  color: string;
  activeColor: string;
}[] = [
  {
    value: "EASY",
    label: "Easy",
    tiers: "VIP · High Value",
    description: "Favourable odds for your best players",
    color: "border-emerald-200 bg-emerald-50 text-emerald-900",
    activeColor: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-400/40",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    tiers: "Medium Value · Low Value",
    description: "Balanced odds for mid-tier players",
    color: "border-amber-200 bg-amber-50 text-amber-900",
    activeColor: "border-amber-500 bg-amber-50 ring-2 ring-amber-400/40",
  },
  {
    value: "HARD",
    label: "Hard",
    tiers: "Very Low · No Value · New · No Bet 12M",
    description: "Tougher odds for low-value players",
    color: "border-red-200 bg-red-50 text-red-900",
    activeColor: "border-red-500 bg-red-50 ring-2 ring-red-400/40",
  },
];

type Props = {
  difficulties: OddsDifficulty[];
  defaultName?: string;
  defaultSegment?: SheetSegment | null;
  defaultSquares?: Array<{ marketId: number; difficultyId: number }>;
  onSubmit: (name: string, squares: SquareInput[], segment: SheetSegment | null) => Promise<void>;
  submitLabel?: string;
};

export function SheetBuilder({
  difficulties,
  defaultName = "",
  defaultSegment = null,
  defaultSquares,
  onSubmit,
  submitLabel = "Create Sheet",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState(defaultName);
  const [segment, setSegment] = useState<SheetSegment | null>(defaultSegment);
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
        })), segment);
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

      {/* Segment */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Player Segment</p>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {SEGMENTS.map(seg => {
            const active = segment === seg.value;
            return (
              <button
                key={seg.value}
                type="button"
                onClick={() => setSegment(active ? null : seg.value)}
                className={`rounded-xl border-2 p-3 text-left transition-all duration-150 focus:outline-none ${
                  active ? seg.activeColor : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <p className={`text-xs font-bold mb-0.5 ${active ? "" : "text-slate-700"}`}>{seg.label}</p>
                <p className={`text-[10px] font-semibold leading-snug ${active ? "" : "text-slate-500"}`}>
                  {seg.tiers}
                </p>
                <p className={`text-[10px] mt-1 leading-snug ${active ? "" : "text-slate-400"}`}>
                  {seg.description}
                </p>
              </button>
            );
          })}
        </div>
        {!segment && (
          <p className="text-[11px] text-slate-400 mt-2">Optional — leave unset to apply to all players</p>
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
