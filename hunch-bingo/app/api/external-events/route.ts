import { NextResponse } from "next/server";
import type { SuperbetByDateItem, ExternalEventRow, ExternalEventsResponse } from "@/lib/types/externalEvents";

const SUPERBET_BASE =
  "https://production-superbet-offer-ng-be.freetls.fastly.net";

function parseStartDate(startDateStr: string) {
  // expected "YYYY-MM-DD"
  const d = new Date(`${startDateStr}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseStartDateTime(startDateTimeStr: string) {
  const d = new Date(startDateTimeStr);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function formatStartDateParam(d: Date) {
  // API expects a space between date/time; URLSearchParams encodes space as "+"
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} 00:00:00`;
}

function splitTeams(matchName: string) {
  // Feed uses "·" in your example: "Boston Bruins·Philadelphia Flyers"
  // Fallbacks: "-", "vs"
  const raw = matchName ?? "";
  const parts =
    raw.split("·").length > 1
      ? raw.split("·")
      : raw.includes(" vs ")
        ? raw.split(" vs ")
        : raw.includes(" - ")
          ? raw.split(" - ")
          : [raw, ""];

  const homeTeam = (parts[0] ?? "").trim() || "Home";
  const awayTeam = (parts[1] ?? "").trim() || "Away";
  return { homeTeam, awayTeam };
}

function toIso(item: SuperbetByDateItem) {
  // Prefer utcDate if present. Otherwise parse matchDate ("YYYY-MM-DD HH:mm:ss") as UTC.
  if (item.utcDate) return new Date(item.utcDate).toISOString();

  // matchDate is "2026-01-30 00:00:00" (no timezone). Assume UTC.
  const s = item.matchDate?.replace(" ", "T");
  const d = new Date(`${s}Z`);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const startDateTime = searchParams.get("startDateTime");
    const pageParam = searchParams.get("page");

    if (!startDate) {
      return NextResponse.json({ error: "Missing startDate (YYYY-MM-DD)" }, { status: 400 });
    }

    const parsed = parseStartDate(startDate);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid startDate (YYYY-MM-DD)" }, { status: 400 });
    }

    const parsedStartDateTime = startDateTime ? parseStartDateTime(startDateTime) : null;
    if (startDateTime && !parsedStartDateTime) {
      return NextResponse.json(
        { error: "Invalid startDateTime (YYYY-MM-DDTHH:mm)" },
        { status: 400 }
      );
    }
    const page = pageParam ? Number(pageParam) : 1;
    if (!Number.isFinite(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }
    const pageSize = 10;

    const url = new URL(`${SUPERBET_BASE}/v2/en-BE/events/by-date`);
    url.searchParams.set("sportId", "5");
    url.searchParams.set("startDate", formatStartDateParam(parsed));

    const res = await fetch(url.toString(), {
      next: { revalidate: 30 },
      headers: {
        accept: "application/json",
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Superbet fetch failed: ${res.status} ${res.statusText} ${body}`.slice(0, 500) },
        { status: 502 }
      );
    }

    const json = (await res.json()) as unknown;

    const data: SuperbetByDateItem[] = isRecord(json) && Array.isArray(json.data)
      ? (json.data as SuperbetByDateItem[])
      : [];

    const rows: ExternalEventRow[] = data.map((item) => {
      const { homeTeam, awayTeam } = splitTeams(item.matchName);
      return {
        externalId: Number(item.eventId),
        matchName: item.matchName ?? "Unknown match",
        homeTeam,
        awayTeam,
        startTimeIso: toIso(item),
      };
    }).filter((row) => {
      if (!parsedStartDateTime) return true;
      return new Date(row.startTimeIso).getTime() >= parsedStartDateTime.getTime();
    });
    const startIndex = (page - 1) * pageSize;
    const pagedRows = rows.slice(startIndex, startIndex + pageSize);

    const payload: ExternalEventsResponse = {
      startDate,
      rows: pagedRows,
    };

    return NextResponse.json(payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
