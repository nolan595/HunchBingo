"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-11 w-full rounded-lg bg-slate-800/70 border border-purple-500/20 px-4 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20",
        className
      )}
    />
  );
}
