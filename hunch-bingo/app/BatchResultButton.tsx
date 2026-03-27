"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, AlertTriangle, Loader2, PlayCircle } from "lucide-react";
import { batchResultAllClosed } from "@/app/games/[id]/actions";

export function BatchResultButton({ closedCount }: { closedCount: number }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ resulted: number; errors: string[] } | null>(null);

  if (result) {
    const allGood = result.errors.length === 0;
    return (
      <div className={`flex items-start gap-2 text-sm rounded-xl px-3 py-2 border ${allGood ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
        {allGood
          ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          : <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />}
        <div>
          <p className="font-semibold">{result.resulted} game{result.resulted !== 1 ? "s" : ""} resulted</p>
          {result.errors.map((e, i) => (
            <p key={i} className="text-xs mt-0.5 opacity-80">{e}</p>
          ))}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => startTransition(async () => {
        const res = await batchResultAllClosed();
        setResult(res);
      })}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isPending
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <PlayCircle className="h-3.5 w-3.5" />}
      {isPending ? "Resulting..." : `Result All ${closedCount}`}
    </button>
  );
}
