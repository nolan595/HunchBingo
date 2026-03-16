import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-800",
        draft: "bg-zinc-100 text-zinc-600",
        pending: "bg-yellow-100 text-yellow-800",
        open: "bg-blue-100 text-blue-800",
        closed: "bg-orange-100 text-orange-800",
        completed: "bg-green-100 text-green-800",
        won: "bg-green-100 text-green-800",
        lost: "bg-red-100 text-red-800",
        nomatch: "bg-zinc-100 text-zinc-500",
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
