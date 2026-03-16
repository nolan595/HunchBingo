"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createGame(formData: FormData) {
  const name = formData.get("name") as string;
  const eventId = parseInt(formData.get("eventId") as string);
  const openTime = new Date(formData.get("openTime") as string);
  const closeTime = new Date(formData.get("closeTime") as string);

  if (!name || isNaN(eventId)) throw new Error("Invalid input");
  if (closeTime <= openTime) throw new Error("Close time must be after open time");

  await prisma.game.create({
    data: { name, eventId, openTime, closeTime, status: "DRAFT" },
  });

  revalidatePath("/games");
}

export async function deleteGame(id: number) {
  await prisma.game.delete({ where: { id } });
  revalidatePath("/games");
}
