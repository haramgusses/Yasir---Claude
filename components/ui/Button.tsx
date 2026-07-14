import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const button = cva(
  "press inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-performa-green focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap",
  {
    variants: {
      variant: {
        primary: "bg-performa-forest text-white hover:bg-[#0d3d1c] shadow-card",
        green: "bg-performa-green text-white hover:bg-[#186349]",
        navy: "bg-performa-forest text-white hover:bg-[#0d3d1c]",
        outline:
          "border border-line-strong bg-surface text-ink hover:border-performa-green/50 hover:bg-surface-2",
        ghost: "text-ink-soft hover:bg-performa-soft hover:text-ink",
        danger: "bg-clay text-white hover:bg-[#8f371f]",
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
