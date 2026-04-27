export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { GamesList } from "./GamesList";

const PAGE_SIZE = 10;

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1"));
  const skip = (page - 1) * PAGE_SIZE;

  const [total, games, events] = await Promise.all([
    prisma.game.count(),
    prisma.game.findMany({
      orderBy: { createdAt: "desc" },
      include: { event: true },
      skip,
      take: PAGE_SIZE,
    }),
    prisma.externalEvent.findMany({
      where: { matchDate: { not: null, gte: new Date() } },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <GamesList
      games={games}
      events={events}
      total={total}
      page={page}
      totalPages={totalPages}
    />
  );
}
