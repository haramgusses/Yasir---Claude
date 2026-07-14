import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      tone: {
        teal: "bg-performa-soft text-performa-green ring-performa-green/20",
        green: "bg-performa-soft text-performa-green ring-performa-green/20",
        amber: "bg-amberink-soft text-amberink ring-amberink/20",
        red: "bg-clay-soft text-clay ring-clay/20",
        slate: "bg-surface-2 text-ink-mute ring-line-strong",
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
