"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBingoSheet } from "./actions";
import type { OddsDifficulty } from "@/app/generated/prisma";

type SquareState = { marketId: string; difficultyId: string };

const EMPTY_SQUARE: SquareState = { marketId: "", difficultyId: "" };

type Props = { difficulties: OddsDifficulty[] };

export function SheetBuilder({ difficulties }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [squares, setSquares] = useState<SquareState[]>(
    Array.from({ length: 9 }, () => ({ ...EMPTY_SQUARE }))
  );
  const [error, setError] = useState("");

  function updateSquare(index: number, field: keyof SquareState, value: string) {
    setSquares((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const marketIds = squares
      .map((s) => s.marketId.trim())
      .filter((id) => id !== "");

    if (marketIds.length !== 9) {
      setError("All 9 squares must have a Market ID");
      return;
    }
    if (squares.some((s) => !s.difficultyId)) {
      setError("All 9 squares must have a difficulty");
      return;
    }
    if (new Set(marketIds).size !== 9) {
      setError("Market IDs must be unique across all squares");
      return;
    }

    startTransition(async () => {
      try {
        await createBingoSheet(
          name,
          squares.map((s, i) => ({
            position: i + 1,
            marketId: parseInt(s.marketId),
            difficultyId: parseInt(s.difficultyId),
          }))
        );
        router.push("/bingo-sheets");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error saving sheet");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <Label htmlFor="name">Sheet Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sheet A – Low Risk"
          required
        />
      </div>

      <div>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-3">
          Grid (positions 1–9)
        </p>
        <div className="grid grid-cols-3 gap-3">
          {squares.map((sq, i) => (
            <div
              key={i}
              className="border border-white/[0.08] rounded-xl p-3 bg-white/[0.02] space-y-2.5 hover:border-white/[0.14] transition-colors"
            >
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">
                Square {i + 1}
              </p>
              <div className="space-y-1">
                <Label className="text-[10px]">Market ID</Label>
                <Input
                  type="number"
                  min={1}
                  value={sq.marketId}
                  onChange={(e) => updateSquare(i, "marketId", e.target.value)}
                  placeholder="e.g. 547"
                  className="h-8 text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Difficulty</Label>
                <Select
                  value={sq.difficultyId}
                  onValueChange={(v) => updateSquare(i, "difficultyId", v)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {difficulties.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name} ({d.oddsMin}–{d.oddsMax})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Creating…" : "Create Sheet"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/bingo-sheets")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
