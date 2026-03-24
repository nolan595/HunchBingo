"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteBingoSheet, toggleBingoSheet } from "./actions";
import { Trash2, Pencil, LayoutGrid, Trophy, Power } from "lucide-react";
import type { BingoSheet, BingoSheetSquare, OddsDifficulty, Segment } from "@/app/generated/prisma";

type SquareWithDiff  = BingoSheetSquare & { difficulty: OddsDifficulty };
type SheetWithSquares = BingoSheet & {
  segment: Segment | null;
  squares: SquareWithDiff[];
  _count: { gameSheetResults: number };
};

function difficultyStyle(name: string): string {
  if (name === "Near Certain") return "bg-sky-50 text-sky-700 border-sky-200";
  if (name === "Easy")         return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (name === "Medium")       return "bg-amber-50 text-amber-700 border-amber-200";
  if (name === "Hard")         return "bg-red-50 text-red-700 border-red-200";
  if (name === "Extreme")      return "bg-purple-50 text-purple-700 border-purple-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
}

function SheetGrid({ squares, enabled }: { squares: SquareWithDiff[]; enabled: boolean }) {
  const sorted = [...squares].sort((a, b) => a.position - b.position);
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {sorted.map(sq => (
        <div key={sq.position}
          className={`rounded-xl border p-2.5 flex flex-col gap-1 min-w-0 transition-colors ${
            enabled ? "border-slate-200 bg-slate-50" : "border-slate-100 bg-slate-50/50"
          }`}>
          <p className={`text-[13px] font-mono font-bold tabular-nums leading-none ${enabled ? "text-slate-800" : "text-slate-400"}`}>
            {sq.marketId}
          </p>
          <span className={`self-start text-[9px] font-bold uppercase tracking-wider border rounded-full px-1.5 py-0.5 leading-none ${enabled ? difficultyStyle(sq.difficulty.name) : "bg-slate-100 text-slate-400 border-slate-200"}`}>
            {sq.difficulty.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function SheetRow({ sheet, i }: { sheet: SheetWithSquares; i: number }) {
  const [, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Delete this bingo sheet?")) return;
    startTransition(() => deleteBingoSheet(sheet.id));
  }

  function handleToggle() {
    startTransition(() => toggleBingoSheet(sheet.id, !sheet.enabled));
  }

  return (
    <div
      className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 p-5 group animate-enter ${
        sheet.enabled
          ? "border-slate-200 hover:shadow-md hover:-translate-y-0.5"
          : "border-slate-100 opacity-60"
      }`}
      style={{ animationDelay: `${i * 40}ms` }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`font-bold truncate ${sheet.enabled ? "text-slate-900" : "text-slate-500"}`}>
              {sheet.name}
            </h3>
            {!sheet.enabled && (
              <span className="text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 leading-none shrink-0 text-slate-500 bg-slate-100 border-slate-200">
                Disabled
              </span>
            )}
            {sheet.segment && sheet.enabled && (
              <span className="text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 leading-none shrink-0 text-indigo-700 bg-indigo-50 border-indigo-200">
                {sheet.segment.name}
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

        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150 shrink-0">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleToggle}
            title={sheet.enabled ? "Disable sheet" : "Enable sheet"}
            className={`h-8 w-8 ${
              sheet.enabled
                ? "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                : "text-amber-500 hover:text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" asChild
            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 h-8 w-8">
            <Link href={`/bingo-sheets/${sheet.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost"
            onClick={handleDelete}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <SheetGrid squares={sheet.squares} enabled={sheet.enabled} />
    </div>
  );
}

export function BingoSheetList({ sheets }: { sheets: SheetWithSquares[] }) {
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

  const enabledCount = sheets.filter(s => s.enabled).length;

  return (
    <div className="space-y-3">
      {enabledCount < sheets.length && (
        <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 px-1">
          <span className="tabular-nums">{enabledCount}/{sheets.length} active</span>
          <span>·</span>
          <span>{sheets.length - enabledCount} disabled — excluded from new games</span>
        </div>
      )}
      {sheets.map((sheet, i) => (
        <SheetRow key={sheet.id} sheet={sheet} i={i} />
      ))}
    </div>
  );
}
