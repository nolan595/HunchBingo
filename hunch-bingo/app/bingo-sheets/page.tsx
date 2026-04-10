export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BingoSheetList } from "./BingoSheetList";

export default async function BingoSheetsPage() {
  const sheets = await prisma.bingoSheet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      segment: true,
      _count: { select: { gameSheetResults: true } },
    },
  });

  return (
    <div className="animate-enter">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bingo Sheets</h1>
          <p className="text-sm text-slate-500 mt-1">Reusable 3×3 templates used across all games</p>
        </div>
        <div className="flex items-center gap-3">
          {sheets.length > 0 && (
            <span className="text-sm text-slate-400 font-semibold tabular-nums">
              {sheets.length} {sheets.length === 1 ? "sheet" : "sheets"}
            </span>
          )}
          <Button asChild>
            <Link href="/bingo-sheets/new">
              <Plus className="h-4 w-4" /> New Sheet
            </Link>
          </Button>
        </div>
      </div>
      <BingoSheetList sheets={sheets} />
    </div>
  );
}
