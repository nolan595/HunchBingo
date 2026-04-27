import { prisma } from "@/lib/prisma";
import { fetchEvent, findOutcomeForMarket, findBackupOutcome } from "@/lib/offer-api";

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
    usedBackup: boolean;
  };
  const sheetPayloads: { sheetId: number; squares: SquarePayload[] }[] = sheets.map((sheet) => {
    // Pre-seed with all candidate marketIds from all squares so backups never collide
    const usedMarketIds = new Set(sheet.squares.flatMap((sq) => sq.marketIds));

    const squares: SquarePayload[] = sheet.squares.map((square) => {
      const { oddsMin, oddsMax } = square.difficulty;

      // Try each market ID in priority order (same difficulty range)
      for (const candidateId of square.marketIds) {
        const match = findOutcomeForMarket(odds, candidateId, oddsMin, oddsMax);
        if (match) {
          return {
            position: square.position,
            marketId: match.marketId,
            marketName: match.marketName,
            outcomeId: match.outcomeId,
            outcomeName: match.name,
            capturedPrice: match.price,
            status: "PENDING",
            usedBackup: false,
          };
        }
      }

      // All candidate markets failed — try global backup pool
      const backup = findBackupOutcome(odds, oddsMin, oddsMax, usedMarketIds);

      if (backup) {
        usedMarketIds.add(backup.marketId);
        return {
          position: square.position,
          marketId: backup.marketId,
          marketName: backup.marketName,
          outcomeId: backup.outcomeId,
          outcomeName: backup.name,
          capturedPrice: backup.price,
          status: "PENDING",
          usedBackup: true,
        };
      }

      return {
        position: square.position,
        marketId: square.marketIds[0],
        marketName: null,
        outcomeId: null,
        outcomeName: null,
        capturedPrice: null,
        status: "NO_MATCH",
        usedBackup: false,
      };
    });

    return { sheetId: sheet.id, squares };
  });

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
