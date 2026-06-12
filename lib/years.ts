import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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
