import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * The financial year most recently ended for a given balance date —
 * year-end preparation targets the period that has just closed.
 * E.g. balance date 31 March, today June 2026 → 1 Apr 2025 – 31 Mar 2026.
 */
export function currentFinancialYear(balanceMonth: number, balanceDay: number, today = new Date()) {
  const end = new Date(Date.UTC(today.getUTCFullYear(), balanceMonth - 1, balanceDay));
  if (end > today) end.setUTCFullYear(end.getUTCFullYear() - 1);
  const start = new Date(end);
  start.setUTCFullYear(start.getUTCFullYear() - 1);
  start.setUTCDate(start.getUTCDate() + 1);
  return { start, end };
}

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

/** Load a financial year, verifying the signed-in user owns its organisation. */
export async function requireYear(yearId: string) {
  const { userId } = auth();
  if (!userId) return null;
  const year = await prisma.financialYear.findUnique({
    where: { id: yearId },
    include: { org: true },
  });
  if (!year || year.org.clerkUserId !== userId) return null;
  return year;
}

// Transactions that count toward the report: real activity, not transfers
// between the org's own accounts and not reversal pairs.
const reportableWhere = (yearId: string): Prisma.SourceTransactionWhereInput => ({
  batch: { yearId },
  isTransfer: false,
  reversalOfId: null,
  reversedBy: null,
});

export type WorkflowStep = "upload" | "categorise" | "review";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export interface MonthBucket {
  label: string; // "Apr"
  full: string; // "April 2025"
  start: Date;
  end: Date; // last day of the month (UTC)
  inCents: number;
  outCents: number;
}

/** The financial year's months, as empty buckets. */
export function monthBuckets(startDate: Date, endDate: Date): MonthBucket[] {
  const buckets: MonthBucket[] = [];
  const d = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
  while (d <= endDate && buckets.length < 13) {
    const monthEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
    buckets.push({
      label: MONTH_SHORT[d.getUTCMonth()],
      full: `${MONTH_FULL[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
      start: new Date(d),
      end: monthEnd,
      inCents: 0,
      outCents: 0,
    });
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  return buckets;
}

/** Money in / money out per month of the year, from reportable transactions. */
export async function monthlyFlow(yearId: string, startDate: Date, endDate: Date) {
  const buckets = monthBuckets(startDate, endDate);
  const lines = await prisma.sourceTransaction.findMany({
    where: reportableWhere(yearId),
    select: { date: true, amountCents: true },
  });
  const base = startDate.getUTCFullYear() * 12 + startDate.getUTCMonth();
  for (const l of lines) {
    const i = l.date.getUTCFullYear() * 12 + l.date.getUTCMonth() - base;
    const b = buckets[i];
    if (!b) continue;
    if (l.amountCents >= 0) b.inCents += l.amountCents;
    else b.outCents -= l.amountCents;
  }
  return buckets;
}

/**
 * Live progress + running totals for a financial year. Drives the dashboard
 * cards, the step journey, and the summary strip.
 */
export async function yearProgress(yearId: string) {
  const [total, uncategorised, accounts, unverified, splits] = await Promise.all([
    prisma.sourceTransaction.count({ where: reportableWhere(yearId) }),
    prisma.sourceTransaction.count({ where: { ...reportableWhere(yearId), splits: { none: {} } } }),
    prisma.bankAccount.count({ where: { imports: { some: { yearId } } } }),
    prisma.importBatch.count({ where: { yearId, balancesVerified: false } }),
    prisma.transactionSplit.findMany({
      where: { source: { batch: { yearId } } },
      select: { amountCents: true },
    }),
  ]);

  const categorised = total - uncategorised;
  let inCents = 0;
  let outCents = 0;
  for (const s of splits) {
    if (s.amountCents >= 0) inCents += s.amountCents;
    else outCents -= s.amountCents;
  }

  const uploadDone = accounts > 0 && total > 0 && unverified === 0;
  const categoriseDone = total > 0 && uncategorised === 0;
  const pct = total > 0 ? Math.round((categorised / total) * 100) : 0;
  const nextStep: WorkflowStep = !uploadDone
    ? "upload"
    : !categoriseDone
      ? "categorise"
      : "review";

  return {
    total,
    categorised,
    uncategorised,
    accounts,
    unverified,
    uploadDone,
    categoriseDone,
    pct,
    inCents,
    outCents,
    surplusCents: inCents - outCents,
    nextStep,
    started: accounts > 0 || total > 0,
  };
}
