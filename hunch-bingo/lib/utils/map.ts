import type { ExternalEventRow, SuperbetByDateItem } from "@/lib/types/externalEvents";

function splitTeams(matchName: string): { homeTeam: string; awayTeam: string } {
  const raw = (matchName ?? "").trim();

  // Your example uses "·"
  if (raw.includes("·")) {
    const [home, away] = raw.split("·");
    return {
      homeTeam: (home ?? "").trim() || "Home",
      awayTeam: (away ?? "").trim() || "Away",
    };
  }

  // Fallbacks if the feed ever changes format
  if (raw.includes(" vs ")) {
    const [home, away] = raw.split(" vs ");
    return { homeTeam: home.trim() || "Home", awayTeam: away.trim() || "Away" };
  }

  if (raw.includes(" - ")) {
    const [home, away] = raw.split(" - ");
    return { homeTeam: home.trim() || "Home", awayTeam: away.trim() || "Away" };
  }

  return { homeTeam: raw || "Home", awayTeam: "Away" };
}

function toIsoStartTime(e: SuperbetByDateItem): string {
  // Prefer utcDate if present (best)
  if (typeof e.utcDate === "string" && e.utcDate.length > 0) {
    const d = new Date(e.utcDate);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  // matchDate looks like: "2026-01-30 00:00:00" (no timezone)
  // Assume it's UTC to avoid local-time drift.
  if (typeof e.matchDate === "string" && e.matchDate.length > 0) {
    const asIso = e.matchDate.replace(" ", "T"); // "2026-01-30T00:00:00"
    const d = new Date(`${asIso}Z`);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }

  // last resort
  return new Date().toISOString();
}

export function mapSuperbetByDateItemToRow(e: SuperbetByDateItem): ExternalEventRow {
  const { homeTeam, awayTeam } = splitTeams(e.matchName);

  return {
    externalId: Number(e.eventId),
    matchName: e.matchName ?? "Unknown match",
    homeTeam,
    awayTeam,
    startTimeIso: toIsoStartTime(e),
  };
}
