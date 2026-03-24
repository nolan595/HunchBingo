import { prisma } from "@/lib/prisma";
import { SegmentManager } from "./SegmentManager";

export default async function SegmentsPage() {
  const segments = await prisma.segment.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { sheets: true } } },
  });

  return <SegmentManager segments={segments} />;
}
