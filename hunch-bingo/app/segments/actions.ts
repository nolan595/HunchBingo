"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createSegment(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Segment name is required");

  await prisma.segment.create({ data: { name } });
  revalidatePath("/segments");
  revalidatePath("/bingo-sheets");
}

export async function updateSegment(id: number, formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Segment name is required");

  await prisma.segment.update({ where: { id }, data: { name } });
  revalidatePath("/segments");
  revalidatePath("/bingo-sheets");
}

export async function deleteSegment(id: number) {
  // onDelete: SetNull means sheets keep their data, segmentId just becomes null
  await prisma.segment.delete({ where: { id } });
  revalidatePath("/segments");
  revalidatePath("/bingo-sheets");
}
