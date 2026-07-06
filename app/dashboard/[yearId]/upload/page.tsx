import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireYear, isoDate } from "@/lib/years";
import { coverageGaps } from "@/lib/import/verify";
import UploadPanel from "@/components/upload/UploadPanel";

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

  return (
    <UploadPanel
      yearId={year.id}
      yearStart={yearStart}
      yearEnd={yearEnd}
      accounts={data}
      canContinue={
        data.length > 0 &&
        data.some((a) => a.batches.length > 0) &&
        data.every((a) => a.batches.every((b) => b.verified))
      }
    />
  );
}
