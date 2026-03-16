import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-3 py-1 text-sm text-slate-200 transition-colors placeholder:text-slate-600 focus-visible:outline-none focus-visible:border-blue-500/50 focus-visible:ring-1 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
