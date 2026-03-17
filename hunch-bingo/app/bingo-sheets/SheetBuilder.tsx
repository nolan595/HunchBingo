"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createBingoSheet } from "./actions";
import type { OddsDifficulty } from "@/app/generated/prisma";

type SquareState = { marketId: string; difficultyId: string };
const EMPTY_SQUARE: SquareState = { marketId: "", difficultyId: "" };
type Props = { difficulties: OddsDifficulty[] };

const POSITION_LABELS = ["Top-left","Top-center","Top-right","Mid-left","Center","Mid-right","Bot-left","Bot-center","Bot-right"];

export function SheetBuilder({ difficulties }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [squares, setSquares] = useState<SquareState[]>(Array.from({ length: 9 }, () => ({ ...EMPTY_SQUARE })));
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
    const marketIds = squares.map(s => s.marketId.trim()).filter(id => id !== "");
    if (marketIds.length !== 9)       { setError("All 9 squares must have a Market ID"); return; }
    if (squares.some(s => !s.difficultyId)) { setError("All 9 squares must have a difficulty"); return; }
    if (new Set(marketIds).size !== 9) { setError("Market IDs must be unique across all squares"); return; }

    startTransition(async () => {
      try {
        await createBingoSheet(name, squares.map((s, i) => ({
          position: i + 1,
          marketId: parseInt(s.marketId),
          difficultyId: parseInt(s.difficultyId),
        })));
        router.push("/bingo-sheets");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error saving sheet");
      }
    });
  }

  const filledCount = squares.filter(s => s.marketId.trim() && s.difficultyId).length;

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Sheet name */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
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

      {/* Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Grid (3×3)</p>
          <span className="text-[11px] font-bold tabular-nums text-slate-400">
            {filledCount}/9 filled
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {squares.map((sq, i) => {
            const filled = sq.marketId.trim() && sq.difficultyId;
            return (
              <div key={i}
                className={`rounded-xl border-2 p-3 space-y-2.5 transition-all duration-150 ${
                  filled
                    ? "border-indigo-200 bg-indigo-50/40"
                    : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Sq {i + 1}
                  </p>
                  <p className="text-[9px] text-slate-300 font-medium">{POSITION_LABELS[i]}</p>
                </div>
                <div className="space-y-1.5">
                  <Input
                    type="number" min={1}
                    value={sq.marketId}
                    onChange={e => updateSquare(i, "marketId", e.target.value)}
                    placeholder="Market ID"
                    className="h-8 text-sm font-mono font-bold tabular-nums"
                  />
                </div>
                <div>
                  <Select value={sq.difficultyId} onValueChange={v => updateSquare(i, "difficultyId", v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Difficulty…" />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map(d => (
                        <SelectItem key={d.id} value={String(d.id)}>
                          {d.name} <span className="text-slate-400 font-mono">({d.oddsMin}–{d.oddsMax})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
          {pending ? "Creating…" : "Create Sheet"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/bingo-sheets")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
