"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteBingoSheet } from "./actions";
import { Trash2, Pencil, LayoutGrid, Trophy } from "lucide-react";
import type { BingoSheet, BingoSheetSquare, OddsDifficulty, SheetSegment } from "@/app/generated/prisma";

const SEGMENT_STYLES: Record<SheetSegment, { label: string; cls: string }> = {
  EASY:   { label: "Easy",   cls: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  MEDIUM: { label: "Medium", cls: "text-amber-700 bg-amber-50 border-amber-200" },
  HARD:   { label: "Hard",   cls: "text-red-700 bg-red-50 border-red-200" },
};

type SquareWithDiff  = BingoSheetSquare & { difficulty: OddsDifficulty };
type SheetWithSquares = BingoSheet & {
  squares: SquareWithDiff[];
  _count: { gameSheetResults: number };
};

// Named difficulty tiers get semantic colours; unknowns fall back to neutral
function difficultyStyle(name: string): string {
  if (name === "Near Certain") return "bg-sky-50 text-sky-700 border-sky-200";
  if (name === "Easy")         return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (name === "Medium")       return "bg-amber-50 text-amber-700 border-amber-200";
  if (name === "Hard")         return "bg-red-50 text-red-700 border-red-200";
  if (name === "Extreme")      return "bg-purple-50 text-purple-700 border-purple-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function SheetGrid({ squares }: { squares: SquareWithDiff[] }) {
  const sorted = [...squares].sort((a, b) => a.position - b.position);
  // Render as 3 rows — each row is a potential Connect-3 line, so the layout is semantically meaningful
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {sorted.map(sq => (
        <div key={sq.position}
          className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 flex flex-col gap-1 min-w-0">
          <p className="text-[13px] font-mono font-bold text-slate-800 tabular-nums leading-none">
            {sq.marketId}
          </p>
          <span className={`self-start text-[9px] font-bold uppercase tracking-wider border rounded-full px-1.5 py-0.5 leading-none ${difficultyStyle(sq.difficulty.name)}`}>
            {sq.difficulty.name}
          </span>
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
          className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 group animate-enter"
          style={{ animationDelay: `${i * 40}ms` }}>

          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 truncate">{sheet.name}</h3>
                {sheet.segment && (
                  <span className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 leading-none shrink-0 ${SEGMENT_STYLES[sheet.segment].cls}`}>
                    {SEGMENT_STYLES[sheet.segment].label}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[11px] text-slate-400 font-semibold">
                  Created {new Date(sheet.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
                {sheet._count.gameSheetResults > 0 && (
                  <>
                    <span className="text-slate-200">·</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                      <Trophy className="h-3 w-3" />
                      {sheet._count.gameSheetResults} {sheet._count.gameSheetResults === 1 ? "game" : "games"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions — always visible on touch, reveal on hover on desktop */}
            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 shrink-0">
              <Button size="icon" variant="ghost" asChild
                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 h-8 w-8">
                <Link href={`/bingo-sheets/${sheet.id}/edit`}>
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button size="icon" variant="ghost"
                onClick={() => handleDelete(sheet.id)}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          <SheetGrid squares={sheet.squares} />
        </div>
      ))}
    </div>
  );
}
