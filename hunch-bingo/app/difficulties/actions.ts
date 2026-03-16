"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createDifficulty(formData: FormData) {
  const name = formData.get("name") as string;
  const oddsMin = parseFloat(formData.get("oddsMin") as string);
  const oddsMax = parseFloat(formData.get("oddsMax") as string);

  if (!name || isNaN(oddsMin) || isNaN(oddsMax)) throw new Error("Invalid input");
  if (oddsMin >= oddsMax) throw new Error("Min must be less than max");

  await prisma.oddsDifficulty.create({ data: { name, oddsMin, oddsMax } });
  revalidatePath("/difficulties");
}

export async function updateDifficulty(id: number, formData: FormData) {
  const name = formData.get("name") as string;
  const oddsMin = parseFloat(formData.get("oddsMin") as string);
  const oddsMax = parseFloat(formData.get("oddsMax") as string);

  if (!name || isNaN(oddsMin) || isNaN(oddsMax)) throw new Error("Invalid input");
  if (oddsMin >= oddsMax) throw new Error("Min must be less than max");

  await prisma.oddsDifficulty.update({ where: { id }, data: { name, oddsMin, oddsMax } });
  revalidatePath("/difficulties");
}

export async function deleteDifficulty(id: number) {
  await prisma.oddsDifficulty.delete({ where: { id } });
  revalidatePath("/difficulties");
}
