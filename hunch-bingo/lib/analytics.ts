import { prisma } from "@/lib/prisma";

function isoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export type SheetPerformanceRow = {
  sheetId: number;
  sheetName: string;
  segmentId: number | null;
  segmentName: string | null;
  totalGames: number;
  connect3Count: number;
  connect3Rate: number;
  avgScore: number;
  trend: "up" | "down" | "flat" | null; // comparing last 2 weeks
};

export async function getSheetPerformance(segmentId?: number): Promise<SheetPerformanceRow[]> {
  const results = await prisma.gameSheetResult.findMany({
    where: {
      connect3: { not: null },
      game: { status: "COMPLETED" },
      sheet: { enabled: true, ...(segmentId ? { segmentId } : {}) },
    },
    include: {
      sheet: { include: { segment: true } },
      game: { select: { closeTime: true } },
    },
  });

  const bySheet = new Map<number, {
    sheetName: string;
    segmentId: number | null;
    segmentName: string | null;
    games: { connect3: boolean; score: number; closeTime: Date }[];
  }>();

  for (const r of results) {
    if (!bySheet.has(r.sheetId)) {
      bySheet.set(r.sheetId, {
        sheetName: r.sheet.name,
        segmentId: r.sheet.segmentId,
        segmentName: r.sheet.segment?.name ?? null,
        games: [],
      });
    }
    bySheet.get(r.sheetId)!.games.push({
      connect3: r.connect3 ?? false,
      score: r.score ?? 0,
      closeTime: r.game.closeTime,
    });
  }

  return Array.from(bySheet.entries()).map(([sheetId, data]) => {
    const totalGames = data.games.length;
    const connect3Count = data.games.filter(g => g.connect3).length;
    const connect3Rate = totalGames > 0 ? connect3Count / totalGames : 0;
    const avgScore = totalGames > 0
      ? data.games.reduce((s, g) => s + g.score, 0) / totalGames
      : 0;

    // Trend: compare last 2 ISO weeks
    const byWeek = new Map<string, { c3: number; total: number }>();
    for (const g of data.games) {
      const wk = isoWeekLabel(g.closeTime);
      const entry = byWeek.get(wk) ?? { c3: 0, total: 0 };
      entry.total++;
      if (g.connect3) entry.c3++;
      byWeek.set(wk, entry);
    }
    const sortedWeeks = Array.from(byWeek.keys()).sort();
    let trend: SheetPerformanceRow["trend"] = null;
    if (sortedWeeks.length >= 2) {
      const last = byWeek.get(sortedWeeks[sortedWeeks.length - 1])!;
      const prev = byWeek.get(sortedWeeks[sortedWeeks.length - 2])!;
      const lastRate = last.total > 0 ? last.c3 / last.total : 0;
      const prevRate = prev.total > 0 ? prev.c3 / prev.total : 0;
      trend = lastRate > prevRate + 0.05 ? "up" : lastRate < prevRate - 0.05 ? "down" : "flat";
    }

    return { sheetId, ...data, totalGames, connect3Count, connect3Rate, avgScore, trend };
  }).sort((a, b) => b.connect3Rate - a.connect3Rate);
}

export type WeeklyRow = {
  sheetId: number;
  sheetName: string;
  segmentName: string | null;
  weekLabel: string;
  gamesPlayed: number;
  connect3Count: number;
  connect3Rate: number;
};

export async function getWeeklyPerformance(segmentId?: number): Promise<{
  weeks: string[];
  rows: WeeklyRow[];
}> {
  const results = await prisma.gameSheetResult.findMany({
    where: {
      connect3: { not: null },
      game: { status: "COMPLETED" },
      sheet: { enabled: true, ...(segmentId ? { segmentId } : {}) },
    },
    include: {
      sheet: { include: { segment: true } },
      game: { select: { closeTime: true } },
    },
  });

  const buckets = new Map<string, WeeklyRow>();

  for (const r of results) {
    const weekLabel = isoWeekLabel(r.game.closeTime);
    const key = `${r.sheetId}::${weekLabel}`;
    if (!buckets.has(key)) {
      buckets.set(key, {
        sheetId: r.sheetId,
        sheetName: r.sheet.name,
        segmentName: r.sheet.segment?.name ?? null,
        weekLabel,
        gamesPlayed: 0,
        connect3Count: 0,
        connect3Rate: 0,
      });
    }
    const bucket = buckets.get(key)!;
    bucket.gamesPlayed++;
    if (r.connect3) bucket.connect3Count++;
    bucket.connect3Rate = bucket.connect3Count / bucket.gamesPlayed;
  }

  const rows = Array.from(buckets.values());
  const weeks = [...new Set(rows.map(r => r.weekLabel))].sort();

  return { weeks, rows };
}

export type MarketStatRow = {
  marketId: number;
  marketName: string | null;
  totalUsed: number;
  wonCount: number;
  lostCount: number;
  noMatchCount: number;
  winRate: number | null; // won / (won + lost), null if no settled squares
};

export async function getMarketStats(): Promise<MarketStatRow[]> {
  const squares = await prisma.gameSquareResult.findMany({
    where: { gameSheet: { game: { status: "COMPLETED" }, sheet: { enabled: true } } },
    select: { marketId: true, marketName: true, status: true },
  });

  const byMarket = new Map<number, MarketStatRow>();

  for (const sq of squares) {
    if (!byMarket.has(sq.marketId)) {
      byMarket.set(sq.marketId, {
        marketId: sq.marketId,
        marketName: null,
        totalUsed: 0,
        wonCount: 0,
        lostCount: 0,
        noMatchCount: 0,
        winRate: null,
      });
    }
    const m = byMarket.get(sq.marketId)!;
    if (sq.marketName) m.marketName = sq.marketName;
    m.totalUsed++;
    if (sq.status === "WON") m.wonCount++;
    else if (sq.status === "LOST") m.lostCount++;
    else if (sq.status === "NO_MATCH") m.noMatchCount++;
  }

  return Array.from(byMarket.values()).map(m => ({
    ...m,
    winRate: (m.wonCount + m.lostCount) > 0 ? m.wonCount / (m.wonCount + m.lostCount) : null,
  })).sort((a, b) => b.totalUsed - a.totalUsed);
}

export type DifficultyStatRow = {
  difficultyId: number;
  difficultyName: string;
  oddsMin: number;
  oddsMax: number;
  totalSquares: number;
  wonCount: number;
  lostCount: number;
  noMatchCount: number;
  winRate: number | null;
};

export async function getDifficultyStats(): Promise<DifficultyStatRow[]> {
  const gameSheets = await prisma.gameSheetResult.findMany({
    where: { game: { status: "COMPLETED" }, sheet: { enabled: true } },
    include: {
      squares: true,
      sheet: {
        include: { squares: { include: { difficulty: true } } },
      },
    },
  });

  const byDifficulty = new Map<number, DifficultyStatRow>();

  for (const gs of gameSheets) {
    for (const sq of gs.squares) {
      const template = gs.sheet.squares.find(s => s.position === sq.position);
      if (!template) continue;
      const diff = template.difficulty;
      if (!byDifficulty.has(diff.id)) {
        byDifficulty.set(diff.id, {
          difficultyId: diff.id,
          difficultyName: diff.name,
          oddsMin: diff.oddsMin,
          oddsMax: diff.oddsMax,
          totalSquares: 0,
          wonCount: 0,
          lostCount: 0,
          noMatchCount: 0,
          winRate: null,
        });
      }
      const d = byDifficulty.get(diff.id)!;
      d.totalSquares++;
      if (sq.status === "WON") d.wonCount++;
      else if (sq.status === "LOST") d.lostCount++;
      else if (sq.status === "NO_MATCH") d.noMatchCount++;
    }
  }

  return Array.from(byDifficulty.values()).map(d => ({
    ...d,
    winRate: (d.wonCount + d.lostCount) > 0 ? d.wonCount / (d.wonCount + d.lostCount) : null,
  })).sort((a, b) => a.oddsMin - b.oddsMin);
}
