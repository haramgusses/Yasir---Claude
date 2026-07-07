import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      tone: {
        teal: "bg-performa-cyan/10 text-performa-cyan ring-performa-cyan/25",
        green: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25",
        amber: "bg-amber-400/10 text-amber-300 ring-amber-400/25",
        red: "bg-red-400/10 text-red-300 ring-red-400/25",
        slate: "bg-white/[0.06] text-ink-mute ring-line-strong",
      },
    },
    defaultVariants: { tone: "slate" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badge> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
