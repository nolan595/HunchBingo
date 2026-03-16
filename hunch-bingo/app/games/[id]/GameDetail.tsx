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
  const base = "rounded-md border p-2 text-center min-h-[72px] flex flex-col items-center justify-center gap-1";

  if (sq.status === "WON") {
    return (
      <div className={`${base} border-green-300 bg-green-50`}>
        <CheckCircle2 className="h-4 w-4 text-green-600" />
        <p className="text-xs font-mono font-bold text-green-700">{sq.marketId}</p>
        {sq.outcomeName && (
          <p className="text-[10px] text-green-600">{sq.outcomeName}</p>
        )}
        {sq.capturedPrice && (
          <p className="text-[10px] text-green-500">{sq.capturedPrice.toFixed(2)}</p>
        )}
      </div>
    );
  }

  if (sq.status === "LOST") {
    return (
      <div className={`${base} border-red-300 bg-red-50`}>
        <XCircle className="h-4 w-4 text-red-500" />
        <p className="text-xs font-mono font-bold text-red-700">{sq.marketId}</p>
        {sq.outcomeName && (
          <p className="text-[10px] text-red-500">{sq.outcomeName}</p>
        )}
        {sq.capturedPrice && (
          <p className="text-[10px] text-red-400">{sq.capturedPrice.toFixed(2)}</p>
        )}
      </div>
    );
  }

  if (sq.status === "NO_MATCH") {
    return (
      <div className={`${base} border-zinc-200 bg-zinc-50`}>
        <AlertCircle className="h-4 w-4 text-zinc-400" />
        <p className="text-xs font-mono text-zinc-400">{sq.marketId}</p>
        <p className="text-[10px] text-zinc-400">No match</p>
      </div>
    );
  }

  // PENDING
  return (
    <div className={`${base} border-blue-200 bg-blue-50`}>
      <Clock className="h-4 w-4 text-blue-400" />
      <p className="text-xs font-mono font-bold text-blue-700">{sq.marketId}</p>
      {sq.outcomeName && (
        <p className="text-[10px] text-blue-600">{sq.outcomeName}</p>
      )}
      {sq.capturedPrice && (
        <p className="text-[10px] text-blue-500">{sq.capturedPrice.toFixed(2)}</p>
      )}
    </div>
  );
}

function SheetResultCard({ sheetResult }: { sheetResult: SheetWithSquares }) {
  const sorted = [...sheetResult.squares].sort((a, b) => a.position - b.position);

  return (
    <div className="bg-white rounded-lg border border-zinc-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-zinc-900 text-sm">{sheetResult.sheet.name}</h3>
        <div className="flex items-center gap-2">
          {sheetResult.score !== null && (
            <span className="text-xs text-zinc-500">{sheetResult.score}/9 won</span>
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
      <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{game.name}</h1>
            <p className="text-sm text-zinc-500 mt-1">{game.event.name}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
              <span>Open: {new Date(game.openTime).toLocaleString()}</span>
              <span>Close: {new Date(game.closeTime).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-3">
            <Badge variant={STATUS_VARIANTS[game.status]} className="text-sm px-3 py-1">
              {STATUS_LABELS[game.status]}
            </Badge>
            {game.status === "COMPLETED" && totalSheets > 0 && (
              <p className="text-sm text-zinc-600">
                <span className="font-semibold text-green-600">{connect3Count}</span>
                {" / "}
                {totalSheets} sheets won Connect 3
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
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
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">
            Sheet Results
            {totalSheets > 0 && (
              <span className="text-sm font-normal text-zinc-400 ml-2">
                ({totalSheets} sheets)
              </span>
            )}
          </h2>
          {game.gameSheetResults.length === 0 ? (
            <p className="text-zinc-400 text-sm">No sheet results yet.</p>
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
