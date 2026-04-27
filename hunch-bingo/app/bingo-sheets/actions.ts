"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export type SquareInput = {
  position: number;
  marketIds: number[];
  difficultyId: number;
};

export async function createBingoSheet(name: string, squares: SquareInput[], segmentId: number | null) {
  if (!name.trim()) throw new Error("Sheet name is required");
  if (squares.length !== 9) throw new Error("Exactly 9 squares required");

  for (const s of squares) {
    if (!s.marketIds.length) throw new Error(`Square ${s.position} needs at least one market ID`);
  }

  // Primary (first) market IDs must be unique across the 9 squares
  const primaryIds = squares.map((s) => s.marketIds[0]);
  if (new Set(primaryIds).size !== primaryIds.length)
    throw new Error("Primary market IDs must be unique across all squares");

  await prisma.bingoSheet.create({
    data: {
      name,
      segmentId: segmentId ?? undefined,
      squares: {
        create: squares.map((s) => ({
          position: s.position,
          marketIds: s.marketIds,
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
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function updateBingoSheet(id: number, name: string, squares: SquareInput[], segmentId: number | null) {
  if (!name.trim()) throw new Error("Sheet name is required");
  if (squares.length !== 9) throw new Error("Exactly 9 squares required");

  for (const s of squares) {
    if (!s.marketIds.length) throw new Error(`Square ${s.position} needs at least one market ID`);
  }

  const primaryIds = squares.map(s => s.marketIds[0]);
  if (new Set(primaryIds).size !== primaryIds.length)
    throw new Error("Primary market IDs must be unique across all squares");

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
            marketIds: s.marketIds,
            difficultyId: s.difficultyId,
          })),
        },
      },
    });
  });

  revalidatePath("/bingo-sheets");
}
