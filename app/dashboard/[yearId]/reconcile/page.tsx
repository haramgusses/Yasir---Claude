import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireYear, isoDate, monthBuckets } from "@/lib/years";
import { coverageGaps } from "@/lib/import/verify";
import ReconcilePanel from "@/components/reconcile/ReconcilePanel";
import type { AccountCoverage } from "@/components/viz/CoverageTimeline";

export const dynamic = "force-dynamic";

export default async function ReconcilePage({ params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) notFound();

  const accounts = await prisma.bankAccount.findMany({
    where: { orgId: year.orgId },
    include: {
      imports: {
        where: { yearId: year.id },
        orderBy: { periodStart: "asc" },
        include: { lines: { select: { amountCents: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const yearStart = isoDate(year.startDate);
  const yearEnd = isoDate(year.endDate);

  const data = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    batches: a.imports.map((b) => {
      const inCents = b.lines.filter((l) => l.amountCents >= 0).reduce((s, l) => s + l.amountCents, 0);
      const outCents = b.lines.filter((l) => l.amountCents < 0).reduce((s, l) => s - l.amountCents, 0);
      return {
        id: b.id,
        fileName: b.fileName ?? "import",
        lines: b.lines.length,
        verified: b.balancesVerified,
        periodStart: b.periodStart ? isoDate(b.periodStart) : null,
        periodEnd: b.periodEnd ? isoDate(b.periodEnd) : null,
        openingBalanceCents: b.openingBalanceCents,
        closingBalanceCents: b.closingBalanceCents,
        inCents,
        outCents,
      };
    }),
    gaps: coverageGaps(
      yearStart,
      yearEnd,
      a.imports
        .filter((b) => b.periodStart && b.periodEnd)
        .map((b) => ({ start: isoDate(b.periodStart!), end: isoDate(b.periodEnd!) }))
    ),
  }));

  // Coverage strips (which months each account's statements touch).
  const buckets = monthBuckets(year.startDate, year.endDate);
  const coverage: AccountCoverage[] = accounts
    .filter((a) => a.imports.length > 0)
    .map((a) => ({
      name: a.name,
      months: buckets.map((b) => ({
        label: b.label,
        full: b.full,
        covered: a.imports.some(
          (imp) =>
            imp.periodStart && imp.periodEnd && imp.periodStart <= b.end && imp.periodEnd >= b.start
        ),
      })),
    }));

  // Possible duplicates: identical account+date+amount+payee appearing more
  // than once and not already explained as a transfer or reversal.
  const dupGroups = await prisma.sourceTransaction.groupBy({
    by: ["accountId", "date", "amountCents", "payee"],
    where: {
      batch: { yearId: year.id },
      isTransfer: false,
      reversalOfId: null,
      reversedBy: null,
    },
    having: { id: { _count: { gt: 1 } } },
    _count: { id: true },
  });
  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const duplicates = dupGroups.map((d) => ({
    account: accountName.get(d.accountId) ?? "",
    date: isoDate(d.date),
    amountCents: d.amountCents,
    payee: d.payee ?? "(no description)",
    count: d._count.id,
  }));

  return (
    <ReconcilePanel
      yearId={year.id}
      accounts={data}
      coverage={coverage}
      duplicates={duplicates}
    />
  );
}
