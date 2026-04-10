export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { GameDetail } from "./GameDetail";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const gameId = parseInt(id);

  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      event: true,
      gameSheetResults: {
        include: {
          sheet: true,
          squares: { orderBy: { position: "asc" } },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!game) notFound();

  return (
    <div>
      <Link
        href="/games"
        className="group inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium"
      >
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to games
      </Link>
      <GameDetail game={game} />
    </div>
  );
}
