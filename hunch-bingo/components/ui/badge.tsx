import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border tracking-wide",
  {
    variants: {
      variant: {
        default: "bg-white/[0.06] text-slate-400 border-white/[0.1]",
        draft: "bg-white/[0.04] text-slate-500 border-white/[0.07]",
        pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
        open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        closed: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        won: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        lost: "bg-red-500/10 text-red-400 border-red-500/20",
        nomatch: "bg-white/[0.04] text-slate-500 border-white/[0.07]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
