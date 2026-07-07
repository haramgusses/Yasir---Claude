import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const button = cva(
  "press inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-performa-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-abyss disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-performa-teal text-white shadow-[0_0_0_1px_rgba(48,207,195,0.25),0_8px_24px_-12px_rgba(17,164,172,0.8)] hover:bg-performa-cyan hover:text-[#04262b]",
        navy: "bg-performa-navy text-white hover:bg-[#1a3a7f]",
        outline:
          "border border-line-strong bg-white/[0.04] text-ink-soft hover:border-performa-cyan/60 hover:text-ink",
        ghost: "text-ink-soft hover:bg-white/[0.07] hover:text-ink",
        danger: "bg-red-500/90 text-white hover:bg-red-500",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(button({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}
