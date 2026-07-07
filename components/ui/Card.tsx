import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "glass rounded-2xl shadow-card transition-shadow duration-200 hover:shadow-lift",
        className
      )}
      {...props}
    />
  );
}
