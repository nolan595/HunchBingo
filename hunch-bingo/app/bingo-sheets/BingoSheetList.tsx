"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteBingoSheet } from "./actions";
import { Trash2, LayoutGrid } from "lucide-react";
import type { BingoSheet, BingoSheetSquare, OddsDifficulty } from "@/app/generated/prisma";

type SquareWithDiff  = BingoSheetSquare & { difficulty: OddsDifficulty };
type SheetWithSquares = BingoSheet & { squares: SquareWithDiff[] };

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy:   "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-amber-50   text-amber-700   border-amber-200",
  Hard:   "bg-red-50     text-red-700     border-red-200",
};

function getDifficultyColor(name: string) {
  return DIFFICULTY_COLORS[name] ?? "bg-slate-100 text-slate-600 border-slate-200";
}

function MiniGrid({ squares }: { squares: SquareWithDiff[] }) {
  const sorted = [...squares].sort((a, b) => a.position - b.position);
  return (
    <div className="grid grid-cols-3 gap-1 w-fit shrink-0">
      {sorted.map(sq => (
        <div key={sq.position}
          className="w-[52px] h-11 border border-slate-200 rounded-lg text-center p-1 bg-slate-50 flex flex-col items-center justify-center gap-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors duration-100">
          <p className="text-[11px] font-mono font-bold text-slate-700 leading-none tabular-nums">{sq.marketId}</p>
          <p className="text-[8px] text-slate-400 leading-tight font-semibold uppercase tracking-wide">{sq.difficulty.name}</p>
        </div>
      ))}
    </div>
  );
}

export function BingoSheetList({ sheets }: { sheets: SheetWithSquares[] }) {
  const [, startTransition] = useTransition();

  function handleDelete(id: number) {
    if (!confirm("Delete this bingo sheet?")) return;
    startTransition(() => deleteBingoSheet(id));
  }

  if (sheets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <LayoutGrid className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">No bingo sheets yet</p>
          <p className="text-xs text-slate-400 mt-0.5">Create a sheet to use it across games</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sheets.map((sheet, i) => (
        <div key={sheet.id}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 flex items-start gap-5 group animate-enter"
          style={{ animationDelay: `${i * 40}ms` }}>
          <MiniGrid squares={sheet.squares} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{sheet.name}</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono font-semibold">
                  Created {new Date(sheet.createdAt).toLocaleDateString("en-GB", {
                    day:"numeric", month:"short", year:"numeric",
                  })}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleDelete(sheet.id)}
                className="text-slate-300 hover:text-red-600 hover:bg-red-50 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-150">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sheet.squares.sort((a, b) => a.position - b.position).map(sq => (
                <span key={sq.position}
                  className={`inline-flex items-center gap-1.5 text-[11px] font-bold border rounded-full px-2.5 py-0.5 ${getDifficultyColor(sq.difficulty.name)}`}>
                  <span className="font-mono tabular-nums">{sq.marketId}</span>
                  <span className="opacity-40">·</span>
                  <span className="uppercase tracking-wide text-[9px]">{sq.difficulty.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
