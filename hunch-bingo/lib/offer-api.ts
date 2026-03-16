const BASE = "https://production-superbet-offer-ng-be.freetls.fastly.net";
const LANG = "en-BE";

export type OfferOutcome = {
  uuid: string;
  marketUuid: string;
  marketId: number;
  outcomeId: number;
  price: number;
  status: string; // "active" | "win" | "lost"
  code: string;
  name: string;
  marketName: string;
  info?: string;
  offerStateId: number;
};

export type OfferEvent = {
  uuid: string;
  eventId: number;
  matchName: string;
  matchDate: string;
  metadata?: {
    status?: string; // "FINISHED"
    homeTeamScore?: string;
    awayTeamScore?: string;
  };
  offerStateStatus: Record<string, string>;
  odds: OfferOutcome[] | null;
  oddsResults: OfferOutcome[] | null;
};

export type OfferApiResponse = {
  error: boolean;
  data: OfferEvent[];
};

export type EventsByDateItem = {
  eventId: number;
  matchName: string;
  matchDate: string;
  sportId: number;
  sportName?: string;
  categoryId: number;
  categoryName?: string;
  tournamentId: number;
  tournamentName?: string;
  homeTeamName?: string;
  awayTeamName?: string;
};

export type EventsByDateResponse = {
  error: boolean;
  data: EventsByDateItem[];
};

export async function fetchEventsByDate(date: string): Promise<EventsByDateItem[]> {
  const startDate = `${date} 00:00:00`;
  const url = `${BASE}/v2/${LANG}/events/by-date?startDate=${encodeURIComponent(startDate)}`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`Offer API error: ${res.status}`);

  const json = (await res.json()) as EventsByDateResponse;
  const items = Array.isArray(json.data) ? json.data : [];
  return items.filter((e) => e.sportId === 5);
}

export async function fetchEvent(
  externalEventId: string,
  oddsResults = false
): Promise<OfferEvent | null> {
  const params = new URLSearchParams();
  if (oddsResults) params.set("oddsResults", "true");

  const url = `${BASE}/v2/${LANG}/events/by-id/${externalEventId}${params.size ? `?${params}` : ""}`;

  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) throw new Error(`Offer API error: ${res.status}`);

  const json = (await res.json()) as OfferApiResponse;
  return json.data?.[0] ?? null;
}

export function findOutcomeForMarket(
  outcomes: OfferOutcome[],
  marketId: number,
  oddsMin: number,
  oddsMax: number
): OfferOutcome | null {
  return (
    outcomes.find(
      (o) =>
        o.marketId === marketId &&
        o.price >= oddsMin &&
        o.price <= oddsMax
    ) ?? null
  );
}
