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
    <div className="grid grid-cols-3 gap-1 w-fit">
      {sorted.map((sq) => (
        <div
          key={sq.position}
          className="w-16 h-14 border border-zinc-200 rounded text-center p-1 bg-zinc-50"
        >
          <p className="text-xs font-mono font-bold text-zinc-700">{sq.marketId}</p>
          <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">
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
      <div className="bg-white rounded-lg border border-zinc-200 p-12 text-center text-zinc-400">
        No bingo sheets yet. Create one to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sheets.map((sheet) => (
        <div
          key={sheet.id}
          className="bg-white rounded-lg border border-zinc-200 p-5 flex items-start gap-6"
        >
          <MiniGrid squares={sheet.squares} />
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900">{sheet.name}</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Created {new Date(sheet.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(sheet.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                    className="inline-flex items-center gap-1 text-xs bg-zinc-100 text-zinc-600 rounded px-1.5 py-0.5"
                  >
                    <span className="font-mono">{sq.marketId}</span>
                    <span className="text-zinc-400">·</span>
                    <span>{sq.difficulty.name}</span>
                  </span>
                ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
