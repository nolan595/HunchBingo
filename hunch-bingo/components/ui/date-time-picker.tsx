"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Check,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toInputString(d: Date, h: number, m: number): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Select date & time…",
  className,
}: DateTimePickerProps) {
  const initial = value ? new Date(value) : null;

  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => initial ?? new Date());
  const [selected, setSelected] = useState<Date | null>(initial);
  const [hour, setHour] = useState(initial?.getHours() ?? 12);
  const [minute, setMinute] = useState(initial?.getMinutes() ?? 0);

  // Text buffer for direct keyboard entry
  const [hourBuf, setHourBuf] = useState<string | null>(null);
  const [minBuf, setMinBuf] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const minRef = useRef<HTMLInputElement>(null);

  // Flags to skip blur commit when we're auto-advancing programmatically
  const skipHourBlur = useRef(false);
  const skipMinBlur = useRef(false);

  // Sync from external value
  useEffect(() => {
    if (!value) return;
    const d = new Date(value);
    setSelected(d);
    setViewDate(d);
    setHour(d.getHours());
    setMinute(d.getMinutes());
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        commitBuffers();
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, hourBuf, minBuf]); // eslint-disable-line react-hooks/exhaustive-deps

  function commitBuffers() {
    if (hourBuf !== null) {
      const n = parseInt(hourBuf);
      if (!isNaN(n)) setHour(Math.min(23, Math.max(0, n)));
      setHourBuf(null);
    }
    if (minBuf !== null) {
      const n = parseInt(minBuf);
      if (!isNaN(n)) setMinute(Math.min(59, Math.max(0, n)));
      setMinBuf(null);
    }
  }

  // ── Hour input handlers ──────────────────────────────────────
  function onHourFocus() {
    setHourBuf("");
    hourRef.current?.select();
  }

  function onHourChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    setHourBuf(digits);

    if (digits.length === 2) {
      const n = parseInt(digits);
      if (n >= 0 && n <= 23) {
        setHour(n);
        setHourBuf(null);
        // Auto-advance to minutes — skip the stale-closure blur commit
        skipHourBlur.current = true;
        minRef.current?.focus();
        minRef.current?.select();
      }
    }
  }

  function onHourKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") { e.preventDefault(); setHour((h) => (h + 1) % 24); setHourBuf(null); }
    if (e.key === "ArrowDown") { e.preventDefault(); setHour((h) => (h - 1 + 24) % 24); setHourBuf(null); }
    if (e.key === "Enter" || e.key === "Tab") {
      const n = parseInt(hourBuf ?? "");
      if (!isNaN(n)) setHour(Math.min(23, Math.max(0, n)));
      setHourBuf(null);
    }
    if (e.key === "Escape") { setHourBuf(null); hourRef.current?.blur(); }
  }

  function onHourBlur() {
    if (skipHourBlur.current) {
      skipHourBlur.current = false;
      return;
    }
    if (hourBuf !== null) {
      const n = parseInt(hourBuf);
      if (!isNaN(n)) setHour(Math.min(23, Math.max(0, n)));
      setHourBuf(null);
    }
  }

  // ── Minute input handlers ────────────────────────────────────
  function onMinFocus() {
    setMinBuf("");
    minRef.current?.select();
  }

  function onMinChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 2);
    setMinBuf(digits);

    if (digits.length === 2) {
      const n = parseInt(digits);
      if (n >= 0 && n <= 59) {
        setMinute(n);
        setMinBuf(null);
        skipMinBlur.current = true;
        minRef.current?.blur();
      }
    }
  }

  function onMinKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") { e.preventDefault(); setMinute((m) => (m + 5) % 60); setMinBuf(null); }
    if (e.key === "ArrowDown") { e.preventDefault(); setMinute((m) => (m - 5 + 60) % 60); setMinBuf(null); }
    if (e.key === "Enter") {
      const n = parseInt(minBuf ?? "");
      if (!isNaN(n)) setMinute(Math.min(59, Math.max(0, n)));
      setMinBuf(null);
    }
    if (e.key === "Escape") { setMinBuf(null); minRef.current?.blur(); }
  }

  function onMinBlur() {
    if (skipMinBlur.current) {
      skipMinBlur.current = false;
      return;
    }
    if (minBuf !== null) {
      const n = parseInt(minBuf);
      if (!isNaN(n)) setMinute(Math.min(59, Math.max(0, n)));
      setMinBuf(null);
    }
  }

  // ── Calendar ─────────────────────────────────────────────────
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();

  function confirm() {
    commitBuffers();
    if (!selected) return;
    onChange(toInputString(selected, hour, minute));
    setOpen(false);
  }

  const displayValue = selected
    ? new Date(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
        hour,
        minute
      ).toLocaleString("en-GB", {
        day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : null;

  const inputClass =
    "w-9 text-xl font-mono font-semibold text-center tabular-nums bg-transparent border-none outline-none caret-blue-400 focus:bg-white/[0.08] focus:rounded-md transition-colors";

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-full items-center gap-2 rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 text-sm text-left transition-colors focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
      >
        <Calendar className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span className={displayValue ? "text-slate-200" : "text-slate-600"}>
          {displayValue ?? placeholder}
        </span>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-72 rounded-xl border border-white/[0.1] bg-[#0c1219] shadow-2xl shadow-black/60 p-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-white/[0.07] hover:text-slate-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-slate-200">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="h-7 w-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-white/[0.07] hover:text-slate-300 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-slate-600 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday =
                today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
              const isSel =
                selected?.getDate() === day && selected?.getMonth() === month && selected?.getFullYear() === year;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelected(new Date(year, month, day))}
                  className={cn(
                    "h-8 w-full rounded-lg text-sm transition-colors",
                    isSel
                      ? "bg-blue-600 text-white font-semibold shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                      : isToday
                      ? "border border-white/[0.18] text-slate-300"
                      : "text-slate-500 hover:bg-white/[0.06] hover:text-slate-200"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-white/[0.07]" />

          {/* Time + Confirm */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">

              {/* Hours column */}
              <div className="flex flex-col items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => { setHour((h) => (h + 1) % 24); setHourBuf(null); }}
                  className="text-slate-600 hover:text-slate-300 transition-colors p-0.5"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <input
                  ref={hourRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={hourBuf !== null ? hourBuf : pad(hour)}
                  onFocus={onHourFocus}
                  onChange={onHourChange}
                  onKeyDown={onHourKeyDown}
                  onBlur={onHourBlur}
                  className={cn(inputClass, "text-slate-100")}
                  aria-label="Hours"
                />
                <button
                  type="button"
                  onClick={() => { setHour((h) => (h - 1 + 24) % 24); setHourBuf(null); }}
                  className="text-slate-600 hover:text-slate-300 transition-colors p-0.5"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <span className="text-2xl font-mono text-slate-600 font-bold pb-0.5">:</span>

              {/* Minutes column */}
              <div className="flex flex-col items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => { setMinute((m) => (m + 5) % 60); setMinBuf(null); }}
                  className="text-slate-600 hover:text-slate-300 transition-colors p-0.5"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <input
                  ref={minRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={2}
                  value={minBuf !== null ? minBuf : pad(minute)}
                  onFocus={onMinFocus}
                  onChange={onMinChange}
                  onKeyDown={onMinKeyDown}
                  onBlur={onMinBlur}
                  className={cn(inputClass, "text-slate-100")}
                  aria-label="Minutes"
                />
                <button
                  type="button"
                  onClick={() => { setMinute((m) => (m - 5 + 60) % 60); setMinBuf(null); }}
                  className="text-slate-600 hover:text-slate-300 transition-colors p-0.5"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

            </div>

            {/* Confirm */}
            <button
              type="button"
              onClick={confirm}
              disabled={!selected}
              className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all shadow-[0_0_16px_rgba(59,130,246,0.25)] hover:shadow-[0_0_24px_rgba(59,130,246,0.45)]"
            >
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
