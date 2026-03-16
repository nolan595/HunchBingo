import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { BingoSheetList } from "./BingoSheetList";

export default async function BingSheetsPage() {
  const sheets = await prisma.bingoSheet.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      squares: {
        orderBy: { position: "asc" },
        include: { difficulty: true },
      },
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Bingo Sheets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Reusable 3×3 templates used across all games
          </p>
        </div>
        <Button asChild>
          <Link href="/bingo-sheets/new">
            <Plus className="h-4 w-4" /> New Sheet
          </Link>
        </Button>
      </div>
      <BingoSheetList sheets={sheets} />
    </>
  );
}
