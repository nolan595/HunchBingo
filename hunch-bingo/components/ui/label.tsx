"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      {...props}
      className={cn("text-sm font-semibold text-purple-300", className)}
    />
  );
}
