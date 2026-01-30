"use server";

import prisma from "@/lib/prisma";

export type CreateSportEventInput = {
  name: string;
  startTimeIso: string;
  externalId: number;
};

export async function createSportEvent(input: CreateSportEventInput) {
  return prisma.sportEvent.create({
    data: {
      name: input.name,
      startTime: new Date(input.startTimeIso),
      externalId: input.externalId,
    },
  });
}

export async function deleteSportEventByExternalId(externalId: number) {
  return prisma.sportEvent.deleteMany({
    where: { externalId },
  });
}
