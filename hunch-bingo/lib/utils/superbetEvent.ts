import type { SuperbetByDateItem, SuperbetByDateResponse } from "@/lib/types/externalEvents";

const SUPERBET_BASE = "https://production-superbet-offer-ng-be.freetls.fastly.net";

export function formatStartDateParam(d: Date) {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} 00:00:00`;
}

export async function fetchSuperbetEventsByDate(startDate: Date): Promise<SuperbetByDateItem[]> {
  const startDateParam = formatStartDateParam(startDate);

  const url = new URL(`${SUPERBET_BASE}/v2/en-BE/events/by-date`);
  url.searchParams.set("startDate", startDateParam);

  const res = await fetch(url.toString(), {
    next: { revalidate: 30 },
    headers: { accept: "application/json" },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Superbet fetch failed: ${res.status} ${res.statusText} ${body}`.slice(0, 600)
    );
  }

  const json = (await res.json()) as unknown;

  if (!isRecord(json)) return [];

  // Real shape: { error: boolean, data: [] }
  const data = (json as SuperbetByDateResponse).data;
  return Array.isArray(data) ? (data as SuperbetByDateItem[]) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
