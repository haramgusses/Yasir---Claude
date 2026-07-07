import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireYear, isoDate, monthBuckets } from "@/lib/years";
import { coverageGaps } from "@/lib/import/verify";
import UploadPanel from "@/components/upload/UploadPanel";
import type { AccountCoverage } from "@/components/viz/CoverageTimeline";

export const dynamic = "force-dynamic";

export default async function UploadPage({ params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) notFound();

  const accounts = await prisma.bankAccount.findMany({
    where: { orgId: year.orgId },
    include: {
      imports: {
        where: { yearId: year.id },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { lines: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const yearStart = isoDate(year.startDate);
  const yearEnd = isoDate(year.endDate);
  const data = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    bankKey: a.bankKey,
    batches: a.imports.map((b) => ({
      id: b.id,
      fileName: b.fileName ?? "import",
      lines: b._count.lines,
      verified: b.balancesVerified,
      periodStart: b.periodStart ? isoDate(b.periodStart) : null,
      periodEnd: b.periodEnd ? isoDate(b.periodEnd) : null,
      openingBalanceCents: b.openingBalanceCents,
      closingBalanceCents: b.closingBalanceCents,
    })),
    gaps: coverageGaps(
      yearStart,
      yearEnd,
      a.imports
        .filter((b) => b.periodStart && b.periodEnd)
        .map((b) => ({ start: isoDate(b.periodStart!), end: isoDate(b.periodEnd!) }))
    ),
  }));

  // A month counts as covered when any uploaded statement period touches it.
  function buildCoverage(): AccountCoverage[] {
    const buckets = monthBuckets(year!.startDate, year!.endDate);
    return accounts
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
  }

  return (
    <UploadPanel
      yearId={year.id}
      yearStart={yearStart}
      yearEnd={yearEnd}
      accounts={data}
      coverage={buildCoverage()}
      canContinue={
        data.length > 0 &&
        // Every account needs at least one verified statement — an account
        // with no uploads must not vacuously pass the "all verified" check.
        data.every((a) => a.batches.length > 0 && a.batches.every((b) => b.verified))
      }
    />
  );
}
