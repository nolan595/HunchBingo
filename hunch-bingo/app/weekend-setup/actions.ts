"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { fetchTopTenEvents } from "@/lib/offer-api";
import { lockPrices } from "@/lib/game-engine";

export async function getTopTenEvents() {
  return fetchTopTenEvents();
}

export type SingleGameResult = {
  name: string;
  opened: boolean;
  error?: string;
};

export async function createSingleGame(
  fixture: { eventId: number; matchName: string; matchDate: string }
): Promise<SingleGameResult> {
  const closeTime = new Date(fixture.matchDate);
  const openTime = new Date();

  if (closeTime <= openTime) {
    return { name: fixture.matchName, opened: false, error: "Kickoff has already passed" };
  }

  let event;
  try {
    event = await prisma.externalEvent.upsert({
      where: { externalEventId: String(fixture.eventId) },
      update: { name: fixture.matchName },
      create: { externalEventId: String(fixture.eventId), name: fixture.matchName },
    });
  } catch (e) {
    return { name: fixture.matchName, opened: false, error: e instanceof Error ? e.message : "DB error" };
  }

  let game;
  try {
    game = await prisma.game.create({
      data: { name: fixture.matchName, eventId: event.id, openTime, closeTime, status: "PENDING" },
    });
  } catch (e) {
    return { name: fixture.matchName, opened: false, error: e instanceof Error ? e.message : "Failed to create game" };
  }

  try {
    await lockPrices(game.id);
    return { name: fixture.matchName, opened: true };
  } catch (e) {
    const reason = e instanceof Error ? e.message : "Odds unavailable";
    return { name: fixture.matchName, opened: false, error: `PENDING — ${reason}` };
  }
}
