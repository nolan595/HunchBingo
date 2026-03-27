export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Activity, Clock, ArrowRight, Trophy, ChevronRight,
  AlertTriangle, Zap, TrendingUp, Calendar, LayoutGrid,
} from "lucide-react";
import type { Game, ExternalEvent, GameSheetResult, GameSquareResult } from "@/app/generated/prisma";
import { BatchResultButton } from "./BatchResultButton";

type GameWithData = Game & {
  event: ExternalEvent;
  gameSheetResults: (Pick<GameSheetResult, "connect3"> & {
    squares: Pick<GameSquareResult, "status">[];
  })[];
};

function fmt(d: Date | string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function squareStats(game: GameWithData) {
  const allSquares = game.gameSheetResults.flatMap(r => r.squares);
  const won   = allSquares.filter(s => s.status === "WON").length;
  const total = allSquares.length;
  const rate  = total > 0 ? won / total : null;
  const sheetCount = game.gameSheetResults.length;
  return { won, total, rate, sheetCount };
}

// ── KPI card — slim horizontal layout ────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, iconBg, iconFg, pulse = false, urgent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  iconBg: string;
  iconFg: string;
  pulse?: boolean;
  urgent?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border shadow-sm px-5 py-4 flex items-center gap-4 transition-colors",
      urgent ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200",
    )}>
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-[18px] w-[18px]", iconFg)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className={cn(
            "text-2xl font-bold tabular-nums leading-none",
            urgent ? "text-amber-700" : "text-slate-900",
          )}>
            {value}
          </span>
          {pulse && typeof value === "number" && value > 0 && (
            <span className="relative flex h-2 w-2 mb-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          )}
        </div>
        {sub && <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">{sub}</p>}
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────
function SectionHead({
  label, count, href, icon: Icon, iconFg,
}: {
  label: string;
  count?: number;
  href?: string;
  icon?: React.ElementType;
  iconFg?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className={cn("h-3.5 w-3.5 shrink-0", iconFg ?? "text-slate-400")} />}
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

// ── Closed game card — "Action Required" amber treatment ──────────────
function ActionCard({ game, index }: { game: GameWithData; index: number }) {
  const { sheetCount } = squareStats(game);
  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex items-center gap-4 bg-amber-50 rounded-2xl border border-amber-200 px-5 py-4 hover:border-amber-300 hover:bg-amber-50/80 hover:shadow-sm transition-all duration-150 animate-enter"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shrink-0" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-slate-900 text-sm truncate">{game.name}</p>
          <span className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 uppercase tracking-wide">
            Awaiting Result
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate">{game.event.name}</p>
      </div>

      <div className="hidden md:flex items-center gap-6 shrink-0">
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Closed</p>
          <p className="text-xs font-mono text-slate-600 tabular-nums">{fmt(game.closeTime)}</p>
        </div>
        {sheetCount > 0 && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sheets</p>
            <p className="text-xs font-mono text-slate-700 font-bold tabular-nums">{sheetCount}</p>
          </div>
        )}
      </div>

      <span className="hidden lg:flex items-center gap-1 text-[11px] font-bold text-amber-600 shrink-0 group-hover:gap-1.5 transition-all">
        Result now <ArrowRight className="h-3 w-3" />
      </span>
      <ArrowRight className="flex lg:hidden h-4 w-4 text-amber-400 group-hover:text-amber-600 transition-colors shrink-0" />
    </Link>
  );
}

// ── Active game card — OPEN or PENDING ───────────────────────────────
function ActiveCard({ game, index }: { game: GameWithData; index: number }) {
  const { sheetCount } = squareStats(game);
  const isOpen = game.status === "OPEN";

  return (
    <Link
      href={`/games/${game.id}`}
      className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-enter"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="shrink-0 w-3 flex justify-center">
        {isOpen ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400 block" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-bold text-slate-900 text-sm truncate">{game.name}</p>
          <span className={cn(
            "shrink-0 text-[10px] font-bold rounded-full px-2 py-0.5 uppercase tracking-wide border",
            isOpen
              ? "text-emerald-700 bg-emerald-50 border-emerald-200"
              : "text-amber-700 bg-amber-50 border-amber-200",
          )}>
            {game.status}
          </span>
        </div>
        <p className="text-xs text-slate-400 truncate">{game.event.name}</p>
      </div>

      <div className="hidden md:flex items-center gap-6 shrink-0">
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Opens</p>
          <p className="text-xs font-mono text-slate-600 tabular-nums">{fmt(game.openTime)}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Closes</p>
          <p className="text-xs font-mono text-slate-600 tabular-nums">{fmt(game.closeTime)}</p>
        </div>
        {sheetCount > 0 && (
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sheets</p>
            <p className="text-xs font-mono text-slate-700 font-bold tabular-nums">{sheetCount}</p>
          </div>
        )}
      </div>

      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
    </Link>
  );
}

// ── Completed result row ──────────────────────────────────────────────
function ResultRow({ game, isLast }: { game: GameWithData; isLast: boolean }) {
  const { won, total, rate } = squareStats(game);
  const color =
    rate === null ? null
    : rate >= 0.5  ? { text: "text-emerald-600", bar: "bg-emerald-400" }
    : rate >= 0.33 ? { text: "text-amber-600",   bar: "bg-amber-400"   }
    :                { text: "text-red-600",      bar: "bg-red-400"     };

  return (
    <Link
      href={`/games/${game.id}`}
      className={cn(
        "group flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 transition-colors",
        !isLast && "border-b border-slate-100",
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm truncate group-hover:text-indigo-600 transition-colors">
          {game.name}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{game.event.name}</p>
      </div>

      {color && (
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <p className="text-xs font-bold tabular-nums">
            <span className={color.text}>{won}</span>
            <span className="text-slate-400 font-normal">/{total}</span>
          </p>
          <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div className={cn("h-full rounded-full", color.bar)} style={{ width: `${Math.round(rate! * 100)}%` }} />
          </div>
          <p className={cn("text-xs font-bold tabular-nums w-9 text-right", color.text)}>
            {Math.round(rate! * 100)}%
          </p>
        </div>
      )}

      <p className="text-xs text-slate-400 font-mono tabular-nums shrink-0 hidden lg:block w-16 text-right">
        {new Date(game.openTime).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
      </p>

      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────
export default async function DashboardPage() {
  const [games, sheetCount, eventCount] = await Promise.all([
    prisma.game.findMany({
      orderBy: { openTime: "desc" },
      include: {
        event: true,
        gameSheetResults: {
          select: { connect3: true, squares: { select: { status: true } } },
        },
      },
    }),
    prisma.bingoSheet.count(),
    prisma.externalEvent.count(),
  ]);

  const open      = games.filter(g => g.status === "OPEN");
  const closed    = games.filter(g => g.status === "CLOSED");
  const pending   = games.filter(g => g.status === "PENDING");
  const completed = games.filter(g => g.status === "COMPLETED");

  const allSquares = completed.flatMap(g => g.gameSheetResults.flatMap(r => r.squares));
  const avgRate    = allSquares.length > 0
    ? allSquares.filter(s => s.status === "WON").length / allSquares.length
    : null;

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="space-y-8 animate-enter">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Connect-3 simulation platform</p>
        </div>
        <p className="text-xs text-slate-400 font-mono tabular-nums hidden sm:block">{today}</p>
      </div>

      {/* KPI strip — 4 slim horizontal cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          label="Live Now"
          value={open.length}
          sub={open.length === 1 ? "game active" : "games active"}
          icon={Activity}
          iconBg="bg-emerald-50"
          iconFg="text-emerald-500"
          pulse
        />
        <KpiCard
          label="Need Result"
          value={closed.length}
          sub={closed.length > 0 ? "closed · awaiting resulting" : "all games up to date"}
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconFg="text-amber-500"
          urgent={closed.length > 0}
        />
        <KpiCard
          label="Scheduled"
          value={pending.length}
          sub={pending.length === 1 ? "game queued" : "games queued"}
          icon={Clock}
          iconBg="bg-blue-50"
          iconFg="text-blue-500"
        />
        <KpiCard
          label="Connect-3 Avg"
          value={avgRate !== null ? `${Math.round(avgRate * 100)}%` : "—"}
          sub={completed.length > 0 ? `across ${completed.length} completed game${completed.length !== 1 ? "s" : ""}` : "no completed games yet"}
          icon={TrendingUp}
          iconBg="bg-indigo-50"
          iconFg="text-indigo-500"
        />
      </div>

      {/* Action required — CLOSED games need manual resulting */}
      {closed.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Action Required</h2>
              <span className="text-[11px] font-bold text-slate-300 tabular-nums">({closed.length})</span>
            </div>
            <BatchResultButton closedCount={closed.length} />
          </div>
          <div className="space-y-2">
            {closed.map((g, i) => <ActionCard key={g.id} game={g} index={i} />)}
          </div>
        </section>
      )}

      {/* Live & scheduled — OPEN then PENDING */}
      {(open.length > 0 || pending.length > 0) && (
        <section>
          <SectionHead
            label={open.length > 0 ? "Live & Scheduled" : "Scheduled"}
            count={open.length + pending.length}
            icon={Zap}
            iconFg="text-indigo-400"
          />
          <div className="space-y-2">
            {[...open, ...pending].map((g, i) => <ActiveCard key={g.id} game={g} index={i} />)}
          </div>
        </section>
      )}

      {/* Recent results */}
      {completed.length > 0 && (
        <section>
          <SectionHead label="Recent Results" count={completed.length} href="/games" />
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {completed.slice(0, 8).map((g, i) => (
              <ResultRow key={g.id} game={g} isLast={i === Math.min(completed.length, 8) - 1} />
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
          <h2 className="text-lg font-bold text-slate-900 mb-1">Nothing here yet</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
            {sheetCount === 0 || eventCount === 0
              ? "Set up bingo sheets and events before creating your first game"
              : "Everything is ready — create your first simulation game"}
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
