// The integrity invariant (docs/PLAN.md §6.2): per account,
// opening balance + Σ transactions = closing balance. Plus dedupe hashing
// and financial-year date-coverage checks. All amounts in signed cents.

import { createHash } from "crypto";
import type { ParsedLine } from "./parse";

export interface BalanceCheck {
  ok: boolean;
  expectedClosingCents: number;
  differenceCents: number;
  message: string;
}

export function verifyBalances(
  openingCents: number,
  closingCents: number,
  lines: { amountCents: number }[]
): BalanceCheck {
  const sum = lines.reduce((a, l) => a + l.amountCents, 0);
  const expected = openingCents + sum;
  const diff = closingCents - expected;
  return {
    ok: diff === 0,
    expectedClosingCents: expected,
    differenceCents: diff,
    message:
      diff === 0
        ? "Opening balance plus all transactions matches the closing balance."
        : `Doesn't balance yet: there's a difference of ${(Math.abs(diff) / 100).toFixed(2)} — usually a missing statement period or a mis-read row.`,
  };
}

/**
 * When the export includes a running balance column, validate every line:
 * catches mis-parsed amounts and out-of-order/missing rows immediately.
 * Returns indices of lines where the running balance breaks.
 */
export function checkRunningBalance(lines: ParsedLine[]): number[] {
  const breaks: number[] = [];
  let prev: number | null = null;
  for (let i = 0; i < lines.length; i++) {
    const bal = lines[i].balanceCents;
    if (bal === undefined) return []; // no balance column — nothing to check
    if (prev !== null && prev + lines[i].amountCents !== bal) breaks.push(i);
    prev = bal;
  }
  return breaks;
}

/**
 * Dedupe hash for a transaction line, stable across re-uploads. Legitimate
 * identical duplicates (e.g. two $2 fees the same day) are distinguished by
 * an occurrence ordinal computed within the candidate set, so call this with
 * ALL lines for an account (existing + incoming) to get comparable hashes.
 */
export function computeLineHashes(
  lines: { date: string; amountCents: number; payee: string; particulars: string; reference: string }[]
): string[] {
  const seen = new Map<string, number>();
  return lines.map((l) => {
    const key = [l.date, l.amountCents, norm(l.payee), norm(l.particulars), norm(l.reference)].join("|");
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return createHash("sha256").update(`${key}|${n}`).digest("hex");
  });
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export interface CoverageGap {
  fromDate: string; // ISO, first uncovered day
  toDate: string; // ISO, last uncovered day
}

/**
 * Check that import batches tile the financial year with no gaps
 * (PLAN §6.1: gaps are a blocker, shown as a timeline).
 */
export function coverageGaps(
  yearStart: string,
  yearEnd: string,
  periods: { start: string; end: string }[]
): CoverageGap[] {
  if (periods.length === 0) return [{ fromDate: yearStart, toDate: yearEnd }];
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  const gaps: CoverageGap[] = [];
  let covered = addDays(yearStart, -1); // last covered day so far
  for (const p of sorted) {
    if (p.end < yearStart || p.start > yearEnd) continue;
    if (p.start > addDays(covered, 1)) {
      gaps.push({ fromDate: addDays(covered, 1), toDate: addDays(p.start, -1) });
    }
    if (p.end > covered) covered = p.end;
  }
  if (covered < yearEnd) gaps.push({ fromDate: addDays(covered, 1), toDate: yearEnd });
  return gaps;
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}
