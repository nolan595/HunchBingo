export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { DifficultyManager } from "./DifficultyManager";

export default async function DifficultiesPage() {
  const difficulties = await prisma.oddsDifficulty.findMany({
    orderBy: { oddsMin: "asc" },
  });

  return <DifficultyManager difficulties={difficulties} />;
}
