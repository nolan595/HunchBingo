"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SquareInput = {
  position: number;
  marketId: number;
  difficultyId: number;
};

export async function createBingoSheet(name: string, squares: SquareInput[], segmentId: number | null) {
  if (!name.trim()) throw new Error("Sheet name is required");
  if (squares.length !== 9) throw new Error("Exactly 9 squares required");

  const marketIds = squares.map((s) => s.marketId);
  if (new Set(marketIds).size !== marketIds.length)
    throw new Error("Duplicate market IDs are not allowed");

  await prisma.bingoSheet.create({
    data: {
      name,
      segmentId: segmentId ?? undefined,
      squares: {
        create: squares.map((s) => ({
          position: s.position,
          marketId: s.marketId,
          difficultyId: s.difficultyId,
        })),
      },
    },
  });

  revalidatePath("/bingo-sheets");
}

export async function deleteBingoSheet(id: number) {
  await prisma.bingoSheet.delete({ where: { id } });
  revalidatePath("/bingo-sheets");
}

export async function toggleBingoSheet(id: number, enabled: boolean) {
  await prisma.bingoSheet.update({ where: { id }, data: { enabled } });
  revalidatePath("/bingo-sheets");
}

export async function updateBingoSheet(id: number, name: string, squares: SquareInput[], segmentId: number | null) {
  if (!name.trim()) throw new Error("Sheet name is required");
  if (squares.length !== 9) throw new Error("Exactly 9 squares required");

  const marketIds = squares.map(s => s.marketId);
  if (new Set(marketIds).size !== marketIds.length)
    throw new Error("Market IDs must be unique across all squares");

  const sheet = await prisma.bingoSheet.findUnique({ where: { id } });
  if (!sheet) throw new Error("Sheet not found");

  await prisma.$transaction(async (tx) => {
    await tx.bingoSheetSquare.deleteMany({ where: { sheetId: id } });
    await tx.bingoSheet.update({
      where: { id },
      data: {
        name,
        segmentId: segmentId ?? null,
        squares: {
          create: squares.map(s => ({
            position: s.position,
            marketId: s.marketId,
            difficultyId: s.difficultyId,
          })),
        },
      },
    });
  });

  revalidatePath("/bingo-sheets");
}
