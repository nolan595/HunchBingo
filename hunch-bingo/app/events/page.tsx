export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { EventsManager } from "./EventsManager";

export default async function EventsPage() {
  const registeredEvents = await prisma.externalEvent.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <EventsManager registeredEvents={registeredEvents} />;
}
