"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteBingoSheet } from "./actions";
import { Trash2 } from "lucide-react";
import type { BingoSheet, BingoSheetSquare, OddsDifficulty } from "@/app/generated/prisma";

type SquareWithDiff = BingoSheetSquare & { difficulty: OddsDifficulty };
type SheetWithSquares = BingoSheet & { squares: SquareWithDiff[] };

function MiniGrid({ squares }: { squares: SquareWithDiff[] }) {
  const sorted = [...squares].sort((a, b) => a.position - b.position);
  return (
    <div className="grid grid-cols-3 gap-1 w-fit shrink-0">
      {sorted.map((sq) => (
        <div
          key={sq.position}
          className="w-14 h-12 border border-white/[0.08] rounded-md text-center p-1.5 bg-white/[0.02] flex flex-col items-center justify-center"
        >
          <p className="text-xs font-mono font-bold text-slate-300 leading-none">{sq.marketId}</p>
          <p className="text-[9px] text-slate-600 leading-tight mt-1">
            {sq.difficulty.name}
          </p>
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
      <div className="rounded-xl border border-white/[0.07] bg-[#0e1520]/60 p-16 text-center text-slate-600">
        No bingo sheets yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sheets.map((sheet) => (
        <div
          key={sheet.id}
          className="bg-[#0e1520]/60 rounded-xl border border-white/[0.07] p-5 flex items-start gap-6 hover:border-white/[0.12] transition-colors"
        >
          <MiniGrid squares={sheet.squares} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-slate-100">{sheet.name}</h3>
                <p className="text-xs text-slate-600 mt-1 font-mono">
                  Created {new Date(sheet.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(sheet.id)}
                className="text-red-500/50 hover:text-red-400 hover:bg-red-500/10 shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sheet.squares
                .sort((a, b) => a.position - b.position)
                .map((sq) => (
                  <span
                    key={sq.position}
                    className="inline-flex items-center gap-1 text-xs bg-white/[0.05] text-slate-400 border border-white/[0.07] rounded-md px-2 py-0.5"
                  >
                    <span className="font-mono text-slate-300">{sq.marketId}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">{sq.difficulty.name}</span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
