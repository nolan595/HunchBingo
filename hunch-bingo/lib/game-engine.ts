import { prisma } from "@/lib/prisma";
import { fetchEvent, findOutcomeForMarket } from "@/lib/offer-api";

export async function lockPrices(gameId: number) {
  const game = await prisma.game.findUniqueOrThrow({
    where: { id: gameId },
    include: { event: true },
  });

  const event = await fetchEvent(game.event.externalEventId);
  if (!event) throw new Error("Event odds not yet available from the Offer API — try again closer to kick-off.");

  const odds = event.odds ?? [];

  const sheets = await prisma.bingoSheet.findMany({
    include: { squares: { include: { difficulty: true } } },
  });

  await prisma.$transaction(async (tx) => {
    await tx.game.update({ where: { id: gameId }, data: { status: "OPEN" } });

    for (const sheet of sheets) {
      const gameSheet = await tx.gameSheetResult.create({
        data: { gameId, sheetId: sheet.id },
      });

      for (const square of sheet.squares) {
        const match = findOutcomeForMarket(
          odds,
          square.marketId,
          square.difficulty.oddsMin,
          square.difficulty.oddsMax
        );

        await tx.gameSquareResult.create({
          data: {
            gameSheetId: gameSheet.id,
            position: square.position,
            marketId: square.marketId,
            marketName: match?.marketName ?? null,
            outcomeId: match?.outcomeId ?? null,
            outcomeName: match?.name ?? null,
            capturedPrice: match?.price ?? null,
            status: match ? "PENDING" : "NO_MATCH",
          },
        });
      }
    }
  });
}
