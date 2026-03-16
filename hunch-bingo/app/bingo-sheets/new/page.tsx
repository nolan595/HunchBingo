import { prisma } from "@/lib/prisma";
import { SheetBuilder } from "../SheetBuilder";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewBingoSheetPage() {
  const difficulties = await prisma.oddsDifficulty.findMany({
    orderBy: { oddsMin: "asc" },
  });

  return (
    <div>
      <Link
        href="/bingo-sheets"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back to sheets
      </Link>
      <h1 className="text-xl font-semibold text-slate-100 tracking-tight mb-6">New Bingo Sheet</h1>
      {difficulties.length === 0 ? (
        <p className="text-slate-500">
          You need at least one difficulty tier before creating a sheet.{" "}
          <Link href="/difficulties" className="text-blue-400 underline">
            Create one now
          </Link>
        </p>
      ) : (
        <SheetBuilder difficulties={difficulties} />
      )}
    </div>
  );
}
