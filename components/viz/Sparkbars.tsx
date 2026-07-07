"use client";

import { useState } from "react";
import { VIZ } from "./palette";
import { nzd } from "@/lib/utils";

export interface SparkMonth {
  full: string;
  inCents: number;
  outCents: number;
}

/**
 * Tiny month-by-month activity bars for the dashboard year cards: one bar
 * per month sized by total movement, hover/focus for the exact figures.
 */
export default function Sparkbars({ months }: { months: SparkMonth[] }) {
  const [active, setActive] = useState<number | null>(null);
  const totals = months.map((m) => m.inCents + m.outCents);
  const max = Math.max(1, ...totals);
  const a = active !== null ? months[active] : null;

  return (
    <div className="relative">
      <div
        className="flex h-9 items-end gap-[3px]"
        role="img"
        aria-label={`Monthly activity: ${months
          .filter((m) => m.inCents + m.outCents > 0)
          .map((m) => `${m.full} ${nzd(m.inCents - m.outCents)} net`)
          .join(", ") || "no activity yet"}`}>
        {months.map((m, i) => {
          const t = m.inCents + m.outCents;
          const net = m.inCents - m.outCents;
          return (
            <span
              key={m.full}
              tabIndex={0}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="flex-1 cursor-default rounded-t-[2px] outline-none focus-visible:ring-1 focus-visible:ring-performa-teal"
              style={{
                height: t === 0 ? 2 : `${Math.max(12, (t / max) * 100)}%`,
                background: t === 0 ? VIZ.grid : net >= 0 ? VIZ.green : VIZ.plum,
                opacity: active !== null && active !== i ? 0.4 : 1,
              }}
            />
          );
        })}
      </div>
      {a && (
        <div
          className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs shadow-lift"
          style={{ background: VIZ.ink, color: "#fff" }}>
          <span className="font-semibold">{a.full}</span> · {nzd(a.inCents)} in ·{" "}
          {nzd(a.outCents)} out
        </div>
      )}
    </div>
  );
}
