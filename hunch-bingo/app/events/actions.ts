"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchEventsByDate } from "@/lib/offer-api";

export async function getEventsByDate(date: string) {
  return fetchEventsByDate(date);
}

export async function registerEvent(externalEventId: string, name: string, matchDate?: string) {
  const matchDateValue = matchDate ? new Date(matchDate) : undefined;
  await prisma.externalEvent.upsert({
    where: { externalEventId },
    update: { name, ...(matchDateValue && { matchDate: matchDateValue }) },
    create: { externalEventId, name, matchDate: matchDateValue },
  });
  revalidatePath("/events");
  revalidatePath("/games");
}

export async function deleteEvent(id: number) {
  await prisma.externalEvent.delete({ where: { id } });
  revalidatePath("/events");
  revalidatePath("/games");
}
