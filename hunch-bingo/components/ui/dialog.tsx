"use client";

import * as React from "react";
import { X } from "lucide-react";

export function Dialog({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div className="relative w-[min(720px,92vw)] rounded-2xl border border-purple-500/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start justify-between p-6 border-b border-purple-500/20">
          <h2 className="text-white text-2xl font-bold">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-white/5"
            aria-label="Close"
            type="button"
          >
            <X className="h-5 w-5 text-white/70" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
