import { prisma } from "@/lib/prisma";
import { SheetBuilder } from "../SheetBuilder";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function NewBingoSheetPage() {
  const difficulties = await prisma.oddsDifficulty.findMany({
    orderBy: { oddsMin: "asc" },
  });

  return (
    <div className="animate-enter">
      <Link
        href="/bingo-sheets"
        className="group inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to sheets
      </Link>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">New Bingo Sheet</h1>
      {difficulties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md">
          <p className="text-sm text-slate-600">
            You need at least one difficulty tier before creating a sheet.{" "}
            <Link href="/difficulties" className="text-indigo-600 font-semibold hover:underline">
              Create one now →
            </Link>
          </p>
        </div>
      ) : (
        <SheetBuilder difficulties={difficulties} />
      )}
    </div>
  );
}
