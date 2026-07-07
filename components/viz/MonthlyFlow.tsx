"use client";

import { useState } from "react";
import { VIZ, nzdShort } from "./palette";
import { nzd } from "@/lib/utils";

export interface MonthFlow {
  label: string; // "Apr"
  full: string; // "April 2025"
  inCents: number;
  outCents: number;
}

const W = 720;
const H = 220;
const PAD = { top: 12, right: 8, bottom: 26, left: 44 };

/**
 * Money in vs money out by month. Grouped thin bars, hover/focus tooltip per
 * month, legend chips, y-gridlines only, sr-only table for non-visual access.
 */
export default function MonthlyFlow({ months }: { months: MonthFlow[] }) {
  const [active, setActive] = useState<number | null>(null);

  const max = Math.max(1, ...months.flatMap((m) => [m.inCents, m.outCents]));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / months.length;
  const barW = Math.min(14, (slot - 10) / 2);
  const y = (cents: number) => PAD.top + innerH * (1 - cents / max);
  const hFor = (cents: number) => (innerH * cents) / max;

  // Gridlines at "nice" round steps (1/2/2.5/5 × 10^n) so labels read as
  // $2k, $4k… rather than arbitrary fractions of the maximum.
  const rawStep = max / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * pow >= rawStep) ?? 10) * pow;
  const ticks: number[] = [];
  for (let t = step; t <= max; t += step) ticks.push(t);

  const a = active !== null ? months[active] : null;

  return (
    <figure className="m-0">
      <div className="flex items-center justify-between">
        <figcaption className="text-sm font-semibold" style={{ color: VIZ.ink }}>
          Cash through the year
        </figcaption>
        <div className="flex items-center gap-4 text-xs" style={{ color: VIZ.muted }}>
          <LegendChip colour={VIZ.green} label="Money in" />
          <LegendChip colour={VIZ.plum} label="Money out" />
        </div>
      </div>

      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Bar chart of money in and money out for each month of the financial year">
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke={VIZ.grid}
                strokeWidth="1"
              />
              <text
                x={PAD.left - 6}
                y={y(t) + 3.5}
                textAnchor="end"
                fontSize="10"
                fill={VIZ.muted}>
                {nzdShort(t)}
              </text>
            </g>
          ))}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + innerH}
            y2={PAD.top + innerH}
            stroke={VIZ.muted}
            strokeWidth="1"
          />

          {months.map((m, i) => {
            const cx = PAD.left + slot * i + slot / 2;
            const dim = active !== null && active !== i;
            return (
              <g
                key={m.full}
                tabIndex={0}
                role="presentation"
                aria-label={`${m.full}: ${nzd(m.inCents)} in, ${nzd(m.outCents)} out`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                style={{ outline: "none", cursor: "default" }}>
                {/* generous hit target */}
                <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={innerH} fill="transparent" />
                <rect
                  x={cx - barW - 1}
                  y={y(m.inCents)}
                  width={barW}
                  height={Math.max(m.inCents > 0 ? 2 : 0, hFor(m.inCents))}
                  rx="3"
                  fill={VIZ.green}
                  opacity={dim ? 0.35 : 1}
                />
                <rect
                  x={cx + 1}
                  y={y(m.outCents)}
                  width={barW}
                  height={Math.max(m.outCents > 0 ? 2 : 0, hFor(m.outCents))}
                  rx="3"
                  fill={VIZ.plum}
                  opacity={dim ? 0.35 : 1}
                />
                <text
                  x={cx}
                  y={H - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill={active === i ? VIZ.ink : VIZ.muted}
                  fontWeight={active === i ? 600 : 400}>
                  {m.label}
                </text>
              </g>
            );
          })}
        </svg>

        {a && active !== null && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg px-3 py-2 text-xs shadow-lift"
            style={{
              left: `${((PAD.left + slot * active + slot / 2) / W) * 100}%`,
              top: 0,
              background: VIZ.tooltip, border: "1px solid rgba(225,229,242,0.16)",
              color: VIZ.ink,
            }}>
            <div className="font-semibold">{a.full}</div>
            <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap">
              <Dot colour={VIZ.green} /> In {nzd(a.inCents)}
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Dot colour={VIZ.plum} /> Out {nzd(a.outCents)}
            </div>
            <div className="mt-1 whitespace-nowrap border-t border-white/20 pt-1">
              Net {nzd(a.inCents - a.outCents)}
            </div>
          </div>
        )}
      </div>

      {/* Non-visual access to the same data */}
      <table className="sr-only">
        <caption>Money in and money out by month</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Money in</th>
            <th>Money out</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.full}>
              <td>{m.full}</td>
              <td>{nzd(m.inCents)}</td>
              <td>{nzd(m.outCents)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function LegendChip({ colour, label }: { colour: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colour }} />
      {label}
    </span>
  );
}

function Dot({ colour }: { colour: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ background: colour }} />;
}
