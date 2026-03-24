"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { deleteBingoSheet, toggleBingoSheet } from "./actions";
import { Trash2, Pencil, LayoutGrid, Trophy } from "lucide-react";
import type { BingoSheet, Segment } from "@/app/generated/prisma";

type SheetRow = BingoSheet & {
  segment: Segment | null;
  _count: { gameSheetResults: number };
};

// ─── Shared actions hook ──────────────────────────────────────────────────────
function useSheetActions(sheet: SheetRow) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => toggleBingoSheet(sheet.id, !sheet.enabled));
  }

  function handleDelete() {
    if (!confirm("Delete this bingo sheet?")) return;
    startTransition(() => deleteBingoSheet(sheet.id));
  }

  return { pending, handleToggle, handleDelete };
}

// ─── Toggle switch ────────────────────────────────────────────────────────────
function ToggleSwitch({
  checked,
  onToggle,
  pending,
}: {
  checked: boolean;
  onToggle: () => void;
  pending: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      disabled={pending}
      title={checked ? "Click to disable" : "Click to enable"}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed ${
        checked ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────
type Tab = "enabled" | "disabled";

function TabBar({
  active,
  onChange,
  enabledCount,
  disabledCount,
}: {
  active: Tab;
  onChange: (t: Tab) => void;
  enabledCount: number;
  disabledCount: number;
}) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4 w-fit">
      {(["enabled", "disabled"] as Tab[]).map((tab) => {
        const count = tab === "enabled" ? enabledCount : disabledCount;
        const isActive = active === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-150 select-none ${
              isActive
                ? "bg-white shadow-sm text-slate-900"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span className="capitalize">{tab}</span>
            <span
              className={`tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive
                  ? tab === "enabled"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-amber-100 text-amber-700"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Desktop table row (only <tr> — valid inside <tbody>) ────────────────────
function SheetTableRow({ sheet, index }: { sheet: SheetRow; index: number }) {
  const { pending, handleToggle, handleDelete } = useSheetActions(sheet);

  return (
    <tr
      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors duration-100 group animate-enter"
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-bold text-sm ${sheet.enabled ? "text-slate-900" : "text-slate-400"}`}>
            {sheet.name}
          </span>
          {sheet.segment && (
            <span className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 leading-none shrink-0 ${
              sheet.enabled
                ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                : "text-slate-400 bg-slate-100 border-slate-200"
            }`}>
              {sheet.segment.name}
            </span>
          )}
        </div>
      </td>
      <td className="px-5 py-3.5 text-xs text-slate-400 font-mono font-semibold tabular-nums whitespace-nowrap">
        {new Date(sheet.createdAt).toLocaleDateString("en-GB", {
          day: "numeric", month: "short", year: "numeric",
        })}
      </td>
      <td className="px-5 py-3.5">
        {sheet._count.gameSheetResults > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
            <Trophy className="h-3 w-3" />
            {sheet._count.gameSheetResults}
          </span>
        ) : (
          <span className="text-[11px] text-slate-300 font-semibold">—</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        <ToggleSwitch checked={sheet.enabled} onToggle={handleToggle} pending={pending} />
      </td>
      <td className="px-5 py-3.5">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
          <Button size="icon" variant="ghost" asChild
            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 h-7 w-7">
            <Link href={`/bingo-sheets/${sheet.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost"
            onClick={handleDelete}
            disabled={pending}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-7 w-7">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

// ─── Mobile card (only <div> — valid inside a div container) ─────────────────
function SheetMobileCard({ sheet, index }: { sheet: SheetRow; index: number }) {
  const { pending, handleToggle, handleDelete } = useSheetActions(sheet);

  return (
    <div
      className={`rounded-2xl border p-4 animate-enter ${
        sheet.enabled
          ? "bg-white border-slate-200 shadow-sm"
          : "bg-slate-50 border-dashed border-slate-300"
      }`}
      style={{ animationDelay: `${index * 25}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-sm ${sheet.enabled ? "text-slate-900" : "text-slate-400"}`}>
              {sheet.name}
            </span>
            {sheet.segment && (
              <span className={`text-[10px] font-bold uppercase tracking-widest border rounded-full px-2 py-0.5 leading-none ${
                sheet.enabled
                  ? "text-indigo-700 bg-indigo-50 border-indigo-200"
                  : "text-slate-400 bg-slate-100 border-slate-200"
              }`}>
                {sheet.segment.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[11px] text-slate-400 font-semibold">
              {new Date(sheet.createdAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
            {sheet._count.gameSheetResults > 0 && (
              <>
                <span className="text-slate-200">·</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
                  <Trophy className="h-3 w-3" />
                  {sheet._count.gameSheetResults} {sheet._count.gameSheetResults === 1 ? "game" : "games"}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ToggleSwitch checked={sheet.enabled} onToggle={handleToggle} pending={pending} />
          <Button size="icon" variant="ghost" asChild
            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 h-8 w-8">
            <Link href={`/bingo-sheets/${sheet.id}/edit`}>
              <Pencil className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button size="icon" variant="ghost"
            onClick={handleDelete}
            disabled={pending}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────────
export function BingoSheetList({ sheets }: { sheets: SheetRow[] }) {
  const [tab, setTab] = useState<Tab>("enabled");

  const active   = sheets.filter(s => s.enabled);
  const disabled = sheets.filter(s => !s.enabled);
  const visible  = tab === "enabled" ? active : disabled;

  if (sheets.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex flex-col items-center gap-3 text-center">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
          <LayoutGrid className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">No bingo sheets yet</p>
          <p className="text-xs text-slate-400 mt-0.5">Create a sheet to use it across games</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <TabBar
        active={tab}
        onChange={setTab}
        enabledCount={active.length}
        disabledCount={disabled.length}
      />

      {visible.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center gap-2 text-center">
          {tab === "enabled" ? (
            <>
              <p className="text-sm font-semibold text-slate-600">All sheets are disabled</p>
              <p className="text-xs text-slate-400">Enable at least one sheet to include it in new games</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-slate-600">No disabled sheets</p>
              <p className="text-xs text-slate-400">Disable a sheet to exclude it from new games</p>
            </>
          )}
        </div>
      )}

      {visible.length > 0 && (
        <>
          {/* Desktop table — tr children only inside tbody */}
          <div className="hidden sm:block rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Name</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Created</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Games</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">Active</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {visible.map((sheet, i) => (
                  <SheetTableRow key={sheet.id} sheet={sheet} index={i} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards — div children only inside div */}
          <div className="sm:hidden space-y-2">
            {visible.map((sheet, i) => (
              <SheetMobileCard key={sheet.id} sheet={sheet} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
