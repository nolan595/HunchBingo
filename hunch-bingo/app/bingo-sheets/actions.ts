"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type SquareInput = {
  position: number;
  marketId: number;
  difficultyId: number;
};

export async function createBingoSheet(name: string, squares: SquareInput[]) {
  if (!name.trim()) throw new Error("Sheet name is required");
  if (squares.length !== 9) throw new Error("Exactly 9 squares required");

  const marketIds = squares.map((s) => s.marketId);
  if (new Set(marketIds).size !== marketIds.length)
    throw new Error("Duplicate market IDs are not allowed");

  await prisma.bingoSheet.create({
    data: {
      name,
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
