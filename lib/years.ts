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
