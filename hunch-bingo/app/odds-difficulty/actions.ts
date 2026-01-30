"use server";

import  prisma  from "@/lib/prisma"; // your prisma.ts at root
import { revalidatePath } from "next/cache";

export type OddsDifficultyInput = {
  name: string;
  minOdd: number;
  maxOdd: number;
};

export async function listOddsDifficulties() {
  return prisma.oddsDifficulty.findMany({
    orderBy: { id: "desc" },
  });
}

export async function createOddsDifficulty(input: OddsDifficultyInput) {
  const created = await prisma.oddsDifficulty.create({ data: input });
  revalidatePath("/odds-difficulty");
  return created;
}

export async function updateOddsDifficulty(id: number, input: OddsDifficultyInput) {
  const updated = await prisma.oddsDifficulty.update({
    where: { id },
    data: input,
  });
  revalidatePath("/odds-difficulty");
  return updated;
}

export async function deleteOddsDifficulty(id: number) {
  await prisma.oddsDifficulty.delete({ where: { id } });
  revalidatePath("/odds-difficulty");
}
