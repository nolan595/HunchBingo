"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { advanceGameStatus, triggerResulting } from "./actions";
import type {
  Game,
  ExternalEvent,
  GameSheetResult,
  GameSquareResult,
  BingoSheet,
} from "@/app/generated/prisma";
import { CheckCircle2, XCircle, AlertCircle, Clock } from "lucide-react";

type SquareWithResult = GameSquareResult;
type SheetWithSquares = GameSheetResult & {
  sheet: BingoSheet;
  squares: SquareWithResult[];
};
type GameWithAll = Game & {
  event: ExternalEvent;
  gameSheetResults: SheetWithSquares[];
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  OPEN: "Open",
  CLOSED: "Closed",
  COMPLETED: "Completed",
};

const STATUS_VARIANTS: Record<
  string,
  "draft" | "pending" | "open" | "closed" | "completed"
> = {
  DRAFT: "draft",
  PENDING: "pending",
  OPEN: "open",
  CLOSED: "closed",
  COMPLETED: "completed",
};

const NEXT_ACTION_LABELS: Record<string, string> = {
  DRAFT: "Publish Round",
  PENDING: "Open Round (Lock Prices)",
  OPEN: "Close Round",
};

function SquareCell({ sq }: { sq: SquareWithResult }) {
  const base =
    "rounded-lg border p-2 text-center min-h-[72px] flex flex-col items-center justify-center gap-1";

  if (sq.status === "WON") {
    return (
      <div className={`${base} border-emerald-500/30 bg-emerald-500/[0.06]`}>
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        <p className="text-xs font-mono font-bold text-emerald-300">{sq.marketId}</p>
        {sq.outcomeName && (
          <p className="text-[10px] text-emerald-500">{sq.outcomeName}</p>
        )}
        {sq.capturedPrice && (
          <p className="text-[10px] text-emerald-600">{sq.capturedPrice.toFixed(2)}</p>
        )}
      </div>
    );
  }

  if (sq.status === "LOST") {
    return (
      <div className={`${base} border-red-500/30 bg-red-500/[0.06]`}>
        <XCircle className="h-4 w-4 text-red-400" />
        <p className="text-xs font-mono font-bold text-red-300">{sq.marketId}</p>
        {sq.outcomeName && (
          <p className="text-[10px] text-red-500">{sq.outcomeName}</p>
        )}
        {sq.capturedPrice && (
          <p className="text-[10px] text-red-600">{sq.capturedPrice.toFixed(2)}</p>
        )}
      </div>
    );
  }

  if (sq.status === "NO_MATCH") {
    return (
      <div className={`${base} border-white/[0.08] bg-white/[0.02]`}>
        <AlertCircle className="h-4 w-4 text-slate-600" />
        <p className="text-xs font-mono text-slate-600">{sq.marketId}</p>
        <p className="text-[10px] text-slate-700">No match</p>
      </div>
    );
  }

  // PENDING
  return (
    <div className={`${base} border-blue-500/20 bg-blue-500/[0.05]`}>
      <Clock className="h-4 w-4 text-blue-500" />
      <p className="text-xs font-mono font-bold text-blue-300">{sq.marketId}</p>
      {sq.outcomeName && (
        <p className="text-[10px] text-blue-500">{sq.outcomeName}</p>
      )}
      {sq.capturedPrice && (
        <p className="text-[10px] text-blue-600">{sq.capturedPrice.toFixed(2)}</p>
      )}
    </div>
  );
}

function SheetResultCard({ sheetResult }: { sheetResult: SheetWithSquares }) {
  const sorted = [...sheetResult.squares].sort((a, b) => a.position - b.position);

  return (
    <div className="bg-[#0e1520]/60 rounded-xl border border-white/[0.07] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-200 text-sm">{sheetResult.sheet.name}</h3>
        <div className="flex items-center gap-2">
          {sheetResult.score !== null && (
            <span className="text-xs text-slate-500 font-mono">{sheetResult.score}/9 won</span>
          )}
          {sheetResult.connect3 !== null && (
            <Badge variant={sheetResult.connect3 ? "completed" : "lost"}>
              {sheetResult.connect3 ? "✓ Connect 3" : "✗ No Connect 3"}
            </Badge>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {sorted.map((sq) => (
          <SquareCell key={sq.id} sq={sq} />
        ))}
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
      try {
        await advanceGameStatus(game.id, game.status);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error advancing status");
      }
    });
  }

  function handleResult() {
    if (!confirm("Trigger resulting? This will fetch final outcomes from the Offer API.")) return;
    setError("");
    startTransition(async () => {
      try {
        await triggerResulting(game.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error triggering resulting");
      }
    });
  }

  const canAdvance = ["DRAFT", "PENDING", "OPEN"].includes(game.status);
  const canResult = game.status === "CLOSED";
  const showResults = ["OPEN", "CLOSED", "COMPLETED"].includes(game.status);

  const connect3Count = game.gameSheetResults.filter((r) => r.connect3 === true).length;
  const totalSheets = game.gameSheetResults.length;

  return (
    <div>
      {/* Header */}
      <div className="bg-[#0e1520]/60 rounded-xl border border-white/[0.07] p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-100 tracking-tight">{game.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{game.event.name}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 font-mono">
              <span>Open: {new Date(game.openTime).toLocaleString()}</span>
              <span>Close: {new Date(game.closeTime).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Badge variant={STATUS_VARIANTS[game.status]} className="text-xs px-2.5 py-1">
              {STATUS_LABELS[game.status]}
            </Badge>
            {game.status === "COMPLETED" && totalSheets > 0 && (
              <p className="text-sm text-slate-500 font-mono">
                <span className="font-semibold text-emerald-400">{connect3Count}</span>
                {" / "}
                {totalSheets} connect 3
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-2">
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
      </div>

      {/* Results */}
      {showResults && (
        <div>
          <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
            Sheet Results
            {totalSheets > 0 && (
              <span className="text-slate-600 ml-2 normal-case tracking-normal">
                ({totalSheets} sheets)
              </span>
            )}
          </h2>
          {game.gameSheetResults.length === 0 ? (
            <p className="text-slate-600 text-sm">No sheet results yet.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {game.gameSheetResults.map((sr) => (
                <SheetResultCard key={sr.id} sheetResult={sr} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
