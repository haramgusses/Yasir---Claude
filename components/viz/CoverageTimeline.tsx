"use client";

import { useState } from "react";
import { VIZ } from "./palette";

export interface AccountCoverage {
  name: string;
  months: { label: string; full: string; covered: boolean }[];
}

/**
 * Which months of the financial year each account's statements cover.
 * Covered = brand green; missing = amber with a diagonal texture so the
 * state never rides on colour alone. Hover/focus names the exact month.
 */
export default function CoverageTimeline({ accounts }: { accounts: AccountCoverage[] }) {
  const [tip, setTip] = useState<string | null>(null);

  return (
    <figure className="m-0">
      <div className="flex items-center justify-between">
        <figcaption className="text-sm font-semibold" style={{ color: VIZ.ink }}>
          Statement coverage
        </figcaption>
        <div className="flex items-center gap-4 text-xs" style={{ color: VIZ.muted }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: VIZ.green }} /> Covered
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg width="10" height="10" className="rounded-sm" aria-hidden="true">
              <rect width="10" height="10" fill="#fdf1d7" />
              <path d="M-2 4 L4 -2 M0 12 L12 0 M6 14 L14 6" stroke="#9a6a16" strokeWidth="1.4" />
            </svg>
            Missing
          </span>
        </div>
      </div>

      <div className="relative mt-2 space-y-2">
        {accounts.map((a) => (
          <div key={a.name} className="flex items-center gap-3">
            <span className="w-32 shrink-0 truncate text-xs" style={{ color: VIZ.muted }}>
              {a.name}
            </span>
            <div className="flex h-6 flex-1 gap-[2px]">
              {a.months.map((m) => {
                const key = `${a.name}|${m.full}`;
                return (
                  <button
                    key={key}
                    type="button"
                    tabIndex={0}
                    aria-label={`${a.name}, ${m.full}: ${m.covered ? "covered by a statement" : "no statement uploaded"}`}
                    onMouseEnter={() => setTip(key)}
                    onMouseLeave={() => setTip(null)}
                    onFocus={() => setTip(key)}
                    onBlur={() => setTip(null)}
                    className="relative flex-1 cursor-default rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-performa-cyan"
                    style={
                      m.covered
                        ? { background: VIZ.green }
                        : {
                            background:
                              "repeating-linear-gradient(45deg, #fdf1d7, #fdf1d7 3px, #d9a23a 3px, #d9a23a 5px)",
                          }
                    }>
                    {tip === key && (
                      <span
                        className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs shadow-lift"
                        style={{ background: VIZ.tooltip, color: "#fff" }}>
                        {m.full} — {m.covered ? "covered" : "missing"}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-1.5 flex justify-between pl-[8.75rem] pr-1 text-[10px]" style={{ color: VIZ.muted }}>
        <span>{accounts[0]?.months[0]?.label}</span>
        <span>{accounts[0]?.months[accounts[0].months.length - 1]?.label}</span>
      </div>
    </figure>
  );
}
