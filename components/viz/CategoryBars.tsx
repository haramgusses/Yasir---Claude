"use client";

import { useState } from "react";
import { VIZ } from "./palette";
import { nzd } from "@/lib/utils";

export interface CategoryRow {
  label: string;
  cents: number;
}

/**
 * Horizontal magnitude bars for one section (revenue OR expenses — never
 * mixed). Single hue per chart, full-width lavender track, direct value
 * labels in ink, hover/focus highlight with share-of-total tooltip.
 */
export default function CategoryBars({
  title,
  rows,
  hue,
}: {
  title: string;
  rows: CategoryRow[];
  hue: "green" | "plum";
}) {
  const [active, setActive] = useState<number | null>(null);
  const colour = hue === "green" ? VIZ.green : VIZ.plum;
  const total = rows.reduce((a, r) => a + r.cents, 0);
  const max = Math.max(1, ...rows.map((r) => r.cents));

  return (
    <figure className="m-0">
      <figcaption className="text-sm font-semibold" style={{ color: VIZ.ink }}>
        {title}
      </figcaption>
      <div className="mt-2 space-y-2.5">
        {rows.map((r, i) => {
          const pct = total > 0 ? Math.round((r.cents / total) * 100) : 0;
          const isActive = active === i;
          return (
            <div
              key={r.label}
              tabIndex={0}
              className="group relative rounded-md outline-none focus-visible:ring-2 focus-visible:ring-performa-teal"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              aria-label={`${r.label}: ${nzd(r.cents)}, ${pct}% of ${title.toLowerCase()}`}>
              <div className="flex items-baseline justify-between gap-3 text-xs">
                <span
                  className="truncate"
                  style={{ color: isActive ? VIZ.ink : VIZ.muted, fontWeight: isActive ? 600 : 400 }}>
                  {r.label}
                </span>
                <span className="shrink-0 tabular-nums font-medium" style={{ color: VIZ.ink }}>
                  {nzd(r.cents)}
                </span>
              </div>
              <div className="mt-1 h-2.5 w-full rounded-full" style={{ background: VIZ.grid }}>
                <div
                  className="h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{
                    width: `${Math.max(1, (r.cents / max) * 100)}%`,
                    background: colour,
                    opacity: active !== null && !isActive ? 0.45 : 1,
                  }}
                />
              </div>
              {isActive && (
                <div
                  className="pointer-events-none absolute right-0 top-full z-10 mt-1 rounded-lg px-2.5 py-1.5 text-xs shadow-lift"
                  style={{ background: VIZ.ink, color: "#fff" }}>
                  {pct}% of {title.toLowerCase()}
                </div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <p className="text-xs" style={{ color: VIZ.muted }}>
            Nothing categorised here yet.
          </p>
        )}
      </div>
    </figure>
  );
}
