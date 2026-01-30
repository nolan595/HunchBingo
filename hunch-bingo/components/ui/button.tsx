"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
  size?: "default" | "icon";
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50 disabled:pointer-events-none";
  const variants = {
    default: "text-white",
    ghost: "text-white/80 hover:text-white hover:bg-white/5",
  };
  const sizes = {
    default: "h-10 px-4 text-sm font-medium",
    icon: "h-9 w-9",
  };

  return (
    <button
      {...props}
      className={cn(base, variants[variant], sizes[size], className)}
    />
  );
}
