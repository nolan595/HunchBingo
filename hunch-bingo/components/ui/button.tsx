"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-indigo-600 text-white shadow-[0_1px_2px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-indigo-500 hover:shadow-[0_2px_8px_rgba(79,70,229,0.4)] active:bg-indigo-700 active:scale-[0.98] active:shadow-none focus-visible:ring-indigo-500",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-500 hover:shadow-md active:bg-red-700 active:scale-[0.98] focus-visible:ring-red-500",
        outline:
          "border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:bg-slate-100 active:scale-[0.98] focus-visible:ring-slate-300",
        ghost:
          "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 active:scale-[0.98] focus-visible:ring-slate-300",
        secondary:
          "bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200 hover:text-slate-900 active:bg-slate-300 active:scale-[0.98] focus-visible:ring-slate-300",
        success:
          "bg-emerald-600 text-white shadow-[0_1px_2px_rgba(16,185,129,0.4)] hover:bg-emerald-500 hover:shadow-md active:bg-emerald-700 active:scale-[0.98] focus-visible:ring-emerald-500",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm:      "h-7 rounded-md px-3 text-xs",
        lg:      "h-11 rounded-xl px-6 text-base",
        icon:    "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
