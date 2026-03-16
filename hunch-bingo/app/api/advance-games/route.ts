import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { lockPrices } from "@/lib/game-engine";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const results = { opened: 0, closed: 0, errors: [] as string[] };

  // Auto-open PENDING games where openTime has passed
  const toOpen = await prisma.game.findMany({
    where: { status: "PENDING", openTime: { lte: now } },
  });

  for (const game of toOpen) {
    try {
      await lockPrices(game.id);
      results.opened++;
    } catch (err) {
      results.errors.push(
        `Game ${game.id} (open): ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  }

  // Auto-close OPEN games where closeTime has passed
  const toClose = await prisma.game.findMany({
    where: { status: "OPEN", closeTime: { lte: now } },
  });

  for (const game of toClose) {
    try {
      await prisma.game.update({
        where: { id: game.id },
        data: { status: "CLOSED" },
      });
      results.closed++;
    } catch (err) {
      results.errors.push(
        `Game ${game.id} (close): ${err instanceof Error ? err.message : "unknown error"}`
      );
    }
  }

  return NextResponse.json(results);
}
