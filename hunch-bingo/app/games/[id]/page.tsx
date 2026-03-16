import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { GameDetail } from "./GameDetail";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-6"
      >
        <ChevronLeft className="h-4 w-4" /> Back to games
      </Link>
      <GameDetail game={game} />
    </div>
  );
}
