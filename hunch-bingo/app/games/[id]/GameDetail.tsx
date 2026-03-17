"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { advanceGameStatus, triggerResulting } from "./actions";
import type {
  Game, ExternalEvent, GameSheetResult, GameSquareResult, BingoSheet,
} from "@/app/generated/prisma";
import { CheckCircle2, XCircle, AlertCircle, Clock, LayoutGrid } from "lucide-react";

type SquareWithResult  = GameSquareResult;
type SheetWithSquares  = GameSheetResult & { sheet: BingoSheet; squares: SquareWithResult[] };
type GameWithAll       = Game & { event: ExternalEvent; gameSheetResults: SheetWithSquares[] };

const STATUS_LABELS: Record<string, string>                                            = { DRAFT:"Draft", PENDING:"Pending", OPEN:"Open", CLOSED:"Closed", COMPLETED:"Completed" };
const STATUS_VARIANTS: Record<string,"draft"|"pending"|"open"|"closed"|"completed">   = { DRAFT:"draft", PENDING:"pending", OPEN:"open", CLOSED:"closed", COMPLETED:"completed" };
const NEXT_ACTION_LABELS: Record<string, string>                                       = { PENDING:"Open Early (Lock Prices)", OPEN:"Close Round" };

function SquareCell({ sq }: { sq: SquareWithResult }) {
  const base = "relative rounded-xl border-2 p-2 text-center min-h-[80px] flex flex-col items-center justify-center gap-1 overflow-hidden transition-all duration-150";

  if (sq.status === "WON") return (
    <div className={`${base} border-emerald-300 bg-gradient-to-br from-emerald-50 to-emerald-100/80`}>
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none">
        <CheckCircle2 className="h-14 w-14 text-emerald-600" />
      </div>
      <CheckCircle2 className="h-4 w-4 text-emerald-500 relative z-10" />
      <p className="text-xs font-mono font-bold text-emerald-900 relative z-10 tabular-nums">{sq.marketId}</p>
      {sq.marketName   && <p className="text-[9px] text-emerald-600 leading-tight relative z-10 line-clamp-1 px-1">{sq.marketName}</p>}
      {sq.outcomeName  && <p className="text-[10px] font-semibold text-emerald-800 relative z-10">{sq.outcomeName}</p>}
      {sq.capturedPrice && <p className="text-[10px] text-emerald-600 font-mono relative z-10 tabular-nums">{sq.capturedPrice.toFixed(2)}×</p>}
    </div>
  );

  if (sq.status === "LOST") return (
    <div className={`${base} border-red-200 bg-gradient-to-br from-red-50 to-red-100/60`}>
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.07] pointer-events-none">
        <XCircle className="h-14 w-14 text-red-500" />
      </div>
      <XCircle className="h-4 w-4 text-red-400 relative z-10" />
      <p className="text-xs font-mono font-bold text-red-900 relative z-10 tabular-nums">{sq.marketId}</p>
      {sq.marketName   && <p className="text-[9px] text-red-500 leading-tight relative z-10 line-clamp-1 px-1">{sq.marketName}</p>}
      {sq.outcomeName  && <p className="text-[10px] font-semibold text-red-700 relative z-10">{sq.outcomeName}</p>}
      {sq.capturedPrice && <p className="text-[10px] text-red-500 font-mono relative z-10 tabular-nums">{sq.capturedPrice.toFixed(2)}×</p>}
    </div>
  );

  if (sq.status === "NO_MATCH") return (
    <div className={`${base} border-slate-200 bg-slate-50`}>
      <AlertCircle className="h-4 w-4 text-slate-300" />
      <p className="text-xs font-mono text-slate-400 tabular-nums">{sq.marketId}</p>
      <p className="text-[10px] text-slate-400">No match</p>
    </div>
  );

  return (
    <div className={`${base} border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50/60`}>
      <div className="h-6 w-6 rounded-full border-2 border-blue-200 flex items-center justify-center">
        <Clock className="h-3 w-3 text-blue-400" />
      </div>
      <p className="text-xs font-mono font-bold text-blue-900 tabular-nums">{sq.marketId}</p>
      {sq.marketName   && <p className="text-[9px] text-blue-500 leading-tight line-clamp-1 px-1">{sq.marketName}</p>}
      {sq.outcomeName  && <p className="text-[10px] font-semibold text-blue-700">{sq.outcomeName}</p>}
      {sq.capturedPrice && <p className="text-[10px] text-blue-500 font-mono tabular-nums">{sq.capturedPrice.toFixed(2)}×</p>}
    </div>
  );
}

function SheetResultCard({ sheetResult }: { sheetResult: SheetWithSquares }) {
  const sorted = [...sheetResult.squares].sort((a, b) => a.position - b.position);
  const wonCount = sheetResult.squares.filter(s => s.status === "WON").length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            <LayoutGrid className="h-3 w-3 text-slate-500 group-hover:text-indigo-500 transition-colors" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">{sheetResult.sheet.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {sheetResult.score !== null && (
            <span className="text-xs text-slate-400 font-mono tabular-nums font-semibold">
              {wonCount}/9
            </span>
          )}
          {sheetResult.connect3 !== null && (
            <Badge variant={sheetResult.connect3 ? "completed" : "lost"}>
              {sheetResult.connect3 ? "Connect 3" : "No Connect 3"}
            </Badge>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sorted.map(sq => <SquareCell key={sq.id} sq={sq} />)}
      </div>
    </div>
  );
}

export function GameDetail({ game }: { game: GameWithAll }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleAdvance() {
    setError("");
    startTransition(async () => {
      try { await advanceGameStatus(game.id, game.status); }
      catch (err) { setError(err instanceof Error ? err.message : "Error advancing status"); }
    });
  }

  function handleResult() {
    if (!confirm("Trigger resulting? This will fetch final outcomes from the Offer API.")) return;
    setError("");
    startTransition(async () => {
      try { await triggerResulting(game.id); }
      catch (err) { setError(err instanceof Error ? err.message : "Error triggering resulting"); }
    });
  }

  const canAdvance    = ["PENDING", "OPEN"].includes(game.status);
  const canResult     = game.status === "CLOSED";
  const showResults   = ["OPEN", "CLOSED", "COMPLETED"].includes(game.status);
  const connect3Count = game.gameSheetResults.filter(r => r.connect3 === true).length;
  const totalSheets   = game.gameSheetResults.length;
  const connect3Rate  = totalSheets > 0 ? connect3Count / totalSheets : null;

  const allSquares    = game.gameSheetResults.flatMap(r => r.squares);
  const wonCount      = allSquares.filter(s => s.status === "WON").length;
  const lostCount     = allSquares.filter(s => s.status === "LOST").length;
  const noMatchCount  = allSquares.filter(s => s.status === "NO_MATCH").length;

  return (
    <div className="animate-enter space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />

        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight truncate">{game.name}</h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">{game.event.name}</p>
            </div>
            <Badge variant={STATUS_VARIANTS[game.status]} className="text-xs px-3 py-1 shrink-0">
              {STATUS_LABELS[game.status]}
            </Badge>
          </div>

          {/* Stats strip */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Opens</p>
              <p className="font-mono text-slate-700 text-xs tabular-nums font-semibold">
                {new Date(game.openTime).toLocaleString("en-GB", {
                  day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit",
                })}
              </p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-100" />
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Closes</p>
              <p className="font-mono text-slate-700 text-xs tabular-nums font-semibold">
                {new Date(game.closeTime).toLocaleString("en-GB", {
                  day:"numeric", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit",
                })}
              </p>
            </div>
            {game.status === "COMPLETED" && totalSheets > 0 && (
              <>
                <div className="hidden sm:block w-px h-8 bg-slate-100" />
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Connect 3</p>
                  <p className="font-mono text-sm font-bold">
                    <span className="text-emerald-600">{connect3Count}</span>
                    <span className="text-slate-400">/{totalSheets}</span>
                  </p>
                </div>
              </>
            )}
            {game.status !== "COMPLETED" && totalSheets > 0 && (
              <>
                <div className="hidden sm:block w-px h-8 bg-slate-100" />
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Sheets</p>
                  <p className="font-mono text-sm font-bold text-slate-700 tabular-nums">{totalSheets}</p>
                </div>
              </>
            )}
          </div>

          {/* Connect-3 rate bar — shown when completed with sheets */}
          {game.status === "COMPLETED" && connect3Rate !== null && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[10px]">Connect-3 Rate</span>
                <span className="font-bold tabular-nums text-slate-700">{Math.round(connect3Rate * 100)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    connect3Rate >= 0.5 ? "bg-emerald-400"
                    : connect3Rate >= 0.33 ? "bg-amber-400"
                    : "bg-red-400"
                  }`}
                  style={{ width: `${Math.round(connect3Rate * 100)}%` }}
                />
              </div>
              {allSquares.length > 0 && (
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-emerald-700 tabular-nums">{wonCount}</span>
                    <span className="text-[10px] text-slate-400">won</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    <span className="text-xs font-bold text-red-700 tabular-nums">{lostCount}</span>
                    <span className="text-[10px] text-slate-400">lost</span>
                  </div>
                  {noMatchCount > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                      <span className="text-xs font-bold text-slate-500 tabular-nums">{noMatchCount}</span>
                      <span className="text-[10px] text-slate-400">no match</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {(canAdvance || canResult) && (
            <div className="mt-5 flex flex-wrap gap-2">
              {canAdvance && (
                <Button onClick={handleAdvance} disabled={pending}>
                  {pending ? "Working…" : NEXT_ACTION_LABELS[game.status]}
                </Button>
              )}
              {canResult && (
                <Button variant="success" onClick={handleResult} disabled={pending}>
                  {pending ? "Resulting…" : "Trigger Resulting"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sheet results */}
      {showResults && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sheet Results</h2>
            {totalSheets > 0 && (
              <span className="text-[11px] font-bold text-slate-400 tabular-nums">({totalSheets})</span>
            )}
          </div>
          {game.gameSheetResults.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <LayoutGrid className="h-4 w-4 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600">No sheet results yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Results will appear once the game opens</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {game.gameSheetResults.map((sr, i) => (
                <div key={sr.id} className="animate-enter" style={{ animationDelay: `${i * 40}ms` }}>
                  <SheetResultCard sheetResult={sr} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
