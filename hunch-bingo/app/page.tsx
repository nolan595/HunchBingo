import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Activity, Clock, LayoutGrid, Calendar,
  ArrowRight, Trophy, ChevronRight,
} from "lucide-react";
import type { Game, ExternalEvent, GameSheetResult } from "@/app/generated/prisma";

type GameWithData = Game & {
  event: ExternalEvent;
  gameSheetResults: Pick<GameSheetResult, "connect3">[];
};

const STATUS_VARIANTS = {
  DRAFT: "draft", PENDING: "pending", OPEN: "open", CLOSED: "closed", COMPLETED: "completed",
} as const;

function fmt(d: Date | string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function connect3Stats(game: GameWithData) {
  const total = game.gameSheetResults.length;
  const hits = game.gameSheetResults.filter(r => r.connect3 === true).length;
  const rate = total > 0 ? hits / total : null;
  return { total, hits, rate };
}

function StatCard({
  label, value, icon: Icon, iconBg, iconFg, pulse = false,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconFg: string;
  pulse?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
        <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", iconBg)}>
          <Icon className={cn("h-4 w-4", iconFg)} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-slate-900 tabular-nums leading-none">{value}</span>
        {pulse && value > 0 && (
          <span className="relative flex h-2 w-2 mb-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ label, count, href }: { label: string; count?: number; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{label}</h2>
        {count !== undefined && (
          <span className="text-[11px] font-bold text-slate-300 tabular-nums">({count})</span>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 transition-colors"
        >
          View all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function ActiveGameCard({ game, index }: { game: GameWithData; index: number }) {
  const { total } = connect3Stats(game);
  const isOpen = game.status === "OPEN";
  const isClosed = game.status === "CLOSED";

  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-enter"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Live indicator */}
      <div className="shrink-0 w-3 flex justify-center">
        {isOpen ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        ) : isClosed ? (
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300 block" />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 block" />
        )}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-slate-900 text-sm truncate">{game.name}</p>
          <Badge
            variant={STATUS_VARIANTS[game.status as keyof typeof STATUS_VARIANTS]}
            className="shrink-0 text-[10px] px-2 py-0"
          >
            {game.status}
          </Badge>
        </div>
        <p className="text-xs text-slate-400 truncate">{game.event.name}</p>
      </div>

      {/* Time info */}
      <div className="hidden md:flex items-center gap-6 shrink-0">
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Opens</p>
          <p className="text-xs font-mono text-slate-600 tabular-nums">{fmt(game.openTime)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Closes</p>
          <p className="text-xs font-mono text-slate-600 tabular-nums">{fmt(game.closeTime)}</p>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sheets</p>
            <p className="text-xs font-mono text-slate-700 font-bold tabular-nums">{total}</p>
          </div>
        )}
      </div>

      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors duration-150 shrink-0" />
    </Link>
  );
}

function CompletedGameRow({ game, isLast }: { game: GameWithData; isLast: boolean }) {
  const { hits, total, rate } = connect3Stats(game);

  const rateColor =
    rate === null ? null
    : rate >= 0.5 ? { text: "text-emerald-600", bar: "bg-emerald-400" }
    : rate >= 0.33 ? { text: "text-amber-600", bar: "bg-amber-400" }
    : { text: "text-red-600", bar: "bg-red-400" };

  return (
    <Link
      href={`/games/${game.id}`}
      className={cn(
        "group flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors",
        !isLast && "border-b border-slate-100"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
          {game.name}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{game.event.name}</p>
      </div>

      {rateColor && (
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <p className="text-xs font-bold tabular-nums">
            <span className={rateColor.text}>{hits}</span>
            <span className="text-slate-400 font-normal">/{total}</span>
          </p>
          <div className="w-24 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={cn("h-full rounded-full", rateColor.bar)}
              style={{ width: `${Math.round(rate! * 100)}%` }}
            />
          </div>
          <p className={cn("text-xs font-bold tabular-nums w-9 text-right", rateColor.text)}>
            {Math.round(rate! * 100)}%
          </p>
        </div>
      )}

      {rate === null && total === 0 && (
        <p className="text-xs text-slate-400 shrink-0 hidden sm:block">No sheets</p>
      )}

      <p className="text-xs text-slate-400 font-mono tabular-nums shrink-0 hidden lg:block w-20 text-right">
        {new Date(game.openTime).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </p>

      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
    </Link>
  );
}

export default async function DashboardPage() {
  const [games, sheetCount, eventCount] = await Promise.all([
    prisma.game.findMany({
      orderBy: { openTime: "desc" },
      include: {
        event: true,
        gameSheetResults: { select: { connect3: true } },
      },
    }),
    prisma.bingoSheet.count(),
    prisma.externalEvent.count(),
  ]);

  const byStatus = {
    open:      games.filter(g => g.status === "OPEN"),
    pending:   games.filter(g => g.status === "PENDING"),
    closed:    games.filter(g => g.status === "CLOSED"),
    completed: games.filter(g => g.status === "COMPLETED"),
  };

  // OPEN first (most urgent), CLOSED second (awaiting result), PENDING last
  const activeGames = [...byStatus.open, ...byStatus.closed, ...byStatus.pending];
  const recentCompleted = byStatus.completed.slice(0, 8);

  const allCompletedSheets = byStatus.completed.flatMap(g => g.gameSheetResults);
  const overallRate = allCompletedSheets.length > 0
    ? allCompletedSheets.filter(r => r.connect3 === true).length / allCompletedSheets.length
    : null;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-8 animate-enter">
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1.5">
            Hunch Bingo
          </p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Connect-3 simulation platform</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 font-mono tabular-nums">{today}</p>
          {overallRate !== null && (
            <p className="text-xs text-slate-400 mt-1">
              Overall Connect-3 rate{" "}
              <span className="font-bold text-slate-700 tabular-nums">
                {Math.round(overallRate * 100)}%
              </span>
            </p>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Live Now"
          value={byStatus.open.length}
          icon={Activity}
          iconBg="bg-emerald-50"
          iconFg="text-emerald-500"
          pulse
        />
        <StatCard
          label="Pending"
          value={byStatus.pending.length}
          icon={Clock}
          iconBg="bg-amber-50"
          iconFg="text-amber-500"
        />
        <StatCard
          label="Bingo Sheets"
          value={sheetCount}
          icon={LayoutGrid}
          iconBg="bg-indigo-50"
          iconFg="text-indigo-500"
        />
        <StatCard
          label="Events"
          value={eventCount}
          icon={Calendar}
          iconBg="bg-violet-50"
          iconFg="text-violet-500"
        />
      </div>

      {/* Active & awaiting */}
      {activeGames.length > 0 && (
        <section>
          <SectionLabel label="Active & Awaiting" count={activeGames.length} />
          <div className="space-y-2">
            {activeGames.map((g, i) => (
              <ActiveGameCard key={g.id} game={g} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Recent results */}
      {recentCompleted.length > 0 && (
        <section>
          <SectionLabel
            label="Recent Results"
            count={byStatus.completed.length}
            href="/games"
          />
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {recentCompleted.map((g, i) => (
              <CompletedGameRow
                key={g.id}
                game={g}
                isLast={i === recentCompleted.length - 1}
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {games.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-6 w-6 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">No games yet</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
            {sheetCount === 0 || eventCount === 0
              ? "Set up bingo sheets and events before creating your first game"
              : "You have everything ready — create your first simulation game"}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {sheetCount === 0 && (
              <Link
                href="/bingo-sheets/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <LayoutGrid className="h-4 w-4" /> Create Sheet
              </Link>
            )}
            {eventCount === 0 && (
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <Calendar className="h-4 w-4" /> Register Event
              </Link>
            )}
            {sheetCount > 0 && eventCount > 0 && (
              <Link
                href="/games"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-sm font-semibold text-white shadow-sm hover:from-indigo-400 hover:to-indigo-500 transition-all"
              >
                <Trophy className="h-4 w-4" /> Create Game
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
