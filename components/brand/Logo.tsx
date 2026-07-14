import { cn } from "@/lib/utils";

// Performa brand mark, matching the supplied logo: a deep-forest rounded
// tile, gently tilted, carrying a white double-peak stroke — beside a
// lowercase fresh-green wordmark.
export function LogoMark({
  className,
  id: _id,
}: {
  className?: string;
  id?: string;
}) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <g transform="rotate(-8 24 24)">
        <rect x="4" y="6" width="40" height="36" rx="11" fill="#06280f" />
        <path
          d="M14 30 L20.5 20.5 L25 26 L31 17.5 L34.5 22"
          stroke="#ffffff"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

// Full lockup: mark + lowercase "performa" wordmark, with an optional tagline.
export function Logo({
  className,
  tagline,
  light = false,
  markId,
}: {
  className?: string;
  tagline?: string;
  /** Use light text for dark backgrounds (the sidebar). */
  light?: boolean;
  markId?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9 shrink-0" id={markId} />
      <div className="leading-tight">
        <div className="font-serif text-xl font-semibold lowercase tracking-tight text-performa-brand">
          performa
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
