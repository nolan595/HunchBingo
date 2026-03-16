"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,0.2)] hover:shadow-[0_0_22px_rgba(59,130,246,0.35)]",
        destructive: "bg-red-600/80 text-white hover:bg-red-500",
        outline:
          "border border-white/[0.12] bg-transparent hover:bg-white/[0.06] text-slate-300 hover:text-slate-100",
        ghost: "hover:bg-white/[0.06] text-slate-300 hover:text-slate-100",
        secondary: "bg-white/[0.07] text-slate-300 hover:bg-white/[0.1]",
        success:
          "bg-emerald-600/90 text-white hover:bg-emerald-500 shadow-[0_0_16px_rgba(16,185,129,0.2)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
