import { prisma } from "@/lib/prisma";
import { GamesList } from "./GamesList";

export default async function GamesPage() {
  const [games, events] = await Promise.all([
    prisma.game.findMany({
      orderBy: { createdAt: "desc" },
      include: { event: true },
    }),
    prisma.externalEvent.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <GamesList games={games} events={events} />;
}
