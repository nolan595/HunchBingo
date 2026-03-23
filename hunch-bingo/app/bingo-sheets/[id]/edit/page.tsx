import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SheetBuilder } from "../../SheetBuilder";
import { updateBingoSheet } from "../../actions";
import type { SquareInput } from "../../actions";
import type { SheetSegment } from "@/app/generated/prisma";
import Link from "next/link";
import { ChevronLeft, AlertTriangle } from "lucide-react";

export default async function EditBingoSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheetId = parseInt(id);

  if (isNaN(sheetId)) notFound();

  const [sheet, difficulties, pendingGames] = await Promise.all([
    prisma.bingoSheet.findUnique({
      where: { id: sheetId },
      include: { squares: { orderBy: { position: "asc" } } },
    }),
    prisma.oddsDifficulty.findMany({ orderBy: { oddsMin: "asc" } }),
    // Any PENDING/DRAFT game will pick up the edited squares when lockPrices runs —
    // all sheets participate in every game, so we warn about all upcoming games.
    prisma.game.findMany({
      where: { status: { in: ["PENDING", "DRAFT"] } },
      include: { event: true },
      orderBy: { openTime: "asc" },
    }),
  ]);

  if (!sheet) notFound();

  // Bind sheetId into a server action so the client component doesn't need to know it
  async function handleUpdate(name: string, squares: SquareInput[], segment: SheetSegment | null) {
    "use server";
    await updateBingoSheet(sheetId, name, squares, segment);
  }

  return (
    <div className="animate-enter">
      <Link
        href="/bingo-sheets"
        className="group inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to sheets
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
        Edit Sheet
      </h1>
      <p className="text-sm text-slate-500 mb-6">{sheet.name}</p>

      {/* Warning: changes to squares affect upcoming PENDING games */}
      {pendingGames.length > 0 && (
        <div className="mb-6 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 max-w-2xl">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">
              {pendingGames.length} pending{" "}
              {pendingGames.length === 1 ? "game" : "games"} will use the
              updated squares when{" "}
              {pendingGames.length === 1 ? "it opens" : "they open"}
            </p>
            <p className="text-amber-700 text-xs mt-0.5 mb-1.5">
              All bingo sheets are applied to every game at open time. Editing
              squares here affects what gets locked for these games:
            </p>
            <ul className="space-y-0.5">
              {pendingGames.map(g => (
                <li key={g.id} className="text-amber-700 text-xs font-medium">
                  {g.name} · {g.event.name} · opens{" "}
                  {new Date(g.openTime).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {difficulties.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md">
          <p className="text-sm text-slate-600">
            No difficulty tiers found.{" "}
            <Link href="/difficulties" className="text-indigo-600 font-semibold hover:underline">
              Create one first →
            </Link>
          </p>
        </div>
      ) : (
        <SheetBuilder
          difficulties={difficulties}
          defaultName={sheet.name}
          defaultSegment={sheet.segment}
          defaultSquares={sheet.squares.map(s => ({
            marketId: s.marketId,
            difficultyId: s.difficultyId,
          }))}
          onSubmit={handleUpdate}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
}
