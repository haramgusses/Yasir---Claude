import { cn } from "@/lib/utils";

// Performa mark: a stylised bar chart rising into an upward arrow, in the
// brand gradient (navy → teal → cyan). `id` keeps the gradient unique when
// several marks render on one page.
export function LogoMark({
  className,
  id = "performa-grad",
}: {
  className?: string;
  id?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="4" y1="44" x2="42" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#112A61" />
          <stop offset="55%" stopColor="#11A4AC" />
          <stop offset="100%" stopColor="#30CFC3" />
        </linearGradient>
      </defs>
      <rect x="4" y="30" width="7" height="14" rx="2" fill={`url(#${id})`} />
      <rect x="14" y="22" width="7" height="22" rx="2" fill={`url(#${id})`} />
      <rect x="24" y="14" width="7" height="30" rx="2" fill={`url(#${id})`} />
      <path
        d="M28 23 L42 9"
        stroke={`url(#${id})`}
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path
        d="M33.5 9 L42 9 L42 17.5"
        stroke={`url(#${id})`}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Full lockup: mark + "Performa" wordmark, with an optional tagline.
export function Logo({
  className,
  tagline,
  light = false,
  markId,
}: {
  className?: string;
  tagline?: string;
  /** Use light text for dark backgrounds (auth screens). */
  light?: boolean;
  markId?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8 shrink-0" id={markId} />
      <div className="leading-tight">
        <div
          className={cn(
            "font-bold tracking-tight text-lg",
            light ? "text-white" : "text-ink"
          )}>
          Performa
        </div>
        {tagline ? (
          <div className={cn("text-xs", light ? "text-white/60" : "text-ink-mute")}>
            {tagline}
          </div>
        ) : null}
      </div>
    </div>
  );
}
