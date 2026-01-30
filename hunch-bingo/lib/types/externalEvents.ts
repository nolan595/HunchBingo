export type SuperbetByDateItem = {
  uuid: string;
  eventId: number;
  matchName: string;   // "Boston Bruins·Philadelphia Flyers"
  matchDate: string;   // "2026-01-30 00:00:00"
  utcDate?: string;    // "2026-01-30T00:00:00Z"
  // keep it flexible — the feed has loads more fields you might want later
  [key: string]: unknown;
};

export type SuperbetByDateResponse = {
  error: boolean;
  dataIn?: {
    lang?: string;
    startDate?: string;
    [key: string]: unknown;
  };
  data: SuperbetByDateItem[];
};

export type ExternalEventRow = {
  externalId: number;
  matchName: string;
  homeTeam: string;
  awayTeam: string;
  startTimeIso: string;
};

export type ExternalEventsResponse = {
  startDate: string; // YYYY-MM-DD (your UI date)
  rows: ExternalEventRow[];
};
