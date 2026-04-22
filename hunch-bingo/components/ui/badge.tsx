import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border tracking-wide uppercase leading-none",
  {
    variants: {
      variant: {
        default:   "bg-slate-100 text-slate-600 border-slate-200",
        draft:     "bg-slate-100 text-slate-500 border-slate-200",
        pending:   "bg-amber-50  text-amber-700  border-amber-200",
        open:      "bg-blue-50   text-blue-700   border-blue-200",
        closed:    "bg-orange-50 text-orange-700 border-orange-200",
        completed:  "bg-emerald-50  text-emerald-700  border-emerald-200",
        won:        "bg-emerald-50  text-emerald-700  border-emerald-200",
        lost:       "bg-red-50      text-red-700      border-red-200",
        nomatch:    "bg-slate-100   text-slate-500    border-slate-200",
        fullsheet:  "bg-amber-50    text-amber-700    border-amber-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

const DOT_COLORS: Partial<Record<NonNullable<BadgeProps["variant"]>, string>> = {
  open:       "bg-blue-500 animate-pulse",
  pending:    "bg-amber-500",
  completed:  "bg-emerald-500",
  won:        "bg-emerald-500",
  fullsheet:  "bg-amber-500",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, children, ...props }: BadgeProps) {
  const dotClass = variant ? DOT_COLORS[variant] : undefined;
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dotClass && (
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotClass)} />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
