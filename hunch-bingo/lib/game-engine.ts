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
    where: { enabled: true },
    include: { squares: { include: { difficulty: true } } },
  });

  // Build all square data before touching the DB — keeps the transaction short
  type SquarePayload = {
    position: number;
    marketId: number;
    marketName: string | null;
    outcomeId: number | null;
    outcomeName: string | null;
    capturedPrice: number | null;
    status: "PENDING" | "NO_MATCH";
  };
  const sheetPayloads: { sheetId: number; squares: SquarePayload[] }[] = sheets.map((sheet) => ({
    sheetId: sheet.id,
    squares: sheet.squares.map((square) => {
      const match = findOutcomeForMarket(
        odds,
        square.marketId,
        square.difficulty.oddsMin,
        square.difficulty.oddsMax
      );
      return {
        position: square.position,
        marketId: square.marketId,
        marketName: match?.marketName ?? null,
        outcomeId: match?.outcomeId ?? null,
        outcomeName: match?.name ?? null,
        capturedPrice: match?.price ?? null,
        status: match ? "PENDING" : "NO_MATCH",
      };
    }),
  }));

  // Transaction is now pure DB writes — no async I/O, no risk of timeout
  await prisma.$transaction(
    async (tx) => {
      await tx.game.update({ where: { id: gameId }, data: { status: "OPEN" } });

      for (const { sheetId, squares } of sheetPayloads) {
        const gameSheet = await tx.gameSheetResult.create({
          data: { gameId, sheetId },
        });

        await tx.gameSquareResult.createMany({
          data: squares.map((s) => ({ gameSheetId: gameSheet.id, ...s })),
        });
      }
    },
    { timeout: 30_000 }
  );
}
