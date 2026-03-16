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
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back to sheets
      </Link>
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">New Bingo Sheet</h1>
      {difficulties.length === 0 ? (
        <p className="text-zinc-500">
          You need at least one difficulty tier before creating a sheet.{" "}
          <Link href="/difficulties" className="text-blue-600 underline">
            Create one now
          </Link>
        </p>
      ) : (
        <SheetBuilder difficulties={difficulties} />
      )}
    </div>
  );
}
