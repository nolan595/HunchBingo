"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { lockPrices } from "@/lib/game-engine";
import { fetchEvent, findOutcomeForMarket } from "@/lib/offer-api";
import { evaluateConnect3 } from "@/lib/connect3";
import type { SquareStatus } from "@/app/generated/prisma";

export async function advanceGameStatus(
  gameId: number,
  currentStatus: string
) {
  const next: Record<string, string> = {
    PENDING: "OPEN",
    OPEN: "CLOSED",
  };

  const nextStatus = next[currentStatus];
  if (!nextStatus) throw new Error("Cannot advance from this status");

  if (nextStatus === "OPEN") {
    await lockPrices(gameId);
  } else {
    await prisma.game.update({
      where: { id: gameId },
      data: { status: nextStatus as never },
    });
  }

  revalidatePath(`/games/${gameId}`);
}

export async function triggerResulting(gameId: number) {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    include: {
      event: true,
      gameSheetResults: {
        include: {
          squares: true,
        },
      },
    },
  });

  if (game.status !== "CLOSED") throw new Error("Game must be CLOSED to result");

  const event = await fetchEvent(game.event.externalEventId, true);
  if (!event) throw new Error("Event not found in Offer API");

  const oddsResults = event.oddsResults ?? [];

  await prisma.$transaction(async (tx) => {
    for (const sheet of game.gameSheetResults) {
      const squareStatuses: SquareStatus[] = [];

      for (const sq of sheet.squares.sort((a, b) => a.position - b.position)) {
        let status: SquareStatus = sq.status;

        if (sq.status === "PENDING" && sq.outcomeId !== null) {
          const result = oddsResults.find((o) => o.outcomeId === sq.outcomeId);
          if (result) {
            status = result.status === "win" ? "WON" : "LOST";
          }
        }

        await tx.gameSquareResult.update({
          where: { id: sq.id },
          data: { status },
        });

        squareStatuses.push(status);
      }

      const { connect3, score } = evaluateConnect3(squareStatuses);

      await tx.gameSheetResult.update({
        where: { id: sheet.id },
        data: { connect3, score, completedAt: new Date() },
      });
    }

    await tx.game.update({
      where: { id: gameId },
      data: { status: "COMPLETED" },
    });
  });

  revalidatePath(`/games/${gameId}`);
}

export async function batchResultAllClosed(): Promise<{ resulted: number; errors: string[] }> {
  const closedGames = await prisma.game.findMany({
    where: { status: "CLOSED" },
    select: { id: true, name: true },
  });

  let resulted = 0;
  const errors: string[] = [];

  for (const game of closedGames) {
    try {
      await triggerResulting(game.id);
      resulted++;
    } catch (e) {
      errors.push(`${game.name}: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
  }

  revalidatePath("/");
  revalidatePath("/games");

  return { resulted, errors };
}
