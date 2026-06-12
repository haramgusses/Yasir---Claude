import { notFound } from "next/navigation";
import Link from "next/link";
import { requireYear } from "@/lib/years";
import { prisma } from "@/lib/prisma";
import StepNav from "@/components/workspace/StepNav";

export default async function YearLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { yearId: string };
}) {
  const year = await requireYear(params.yearId);
  if (!year) notFound();

  const [uncategorised, unverified] = await Promise.all([
    prisma.sourceTransaction.count({
      where: {
        batch: { yearId: year.id },
        isTransfer: false,
        reversalOfId: null,
        reversedBy: null,
        splits: { none: {} },
      },
    }),
    prisma.importBatch.count({ where: { yearId: year.id, balancesVerified: false } }),
  ]);

  return (
    <div>
      <div className="mb-1 text-xs text-slate-500 print:hidden">
        <Link href="/dashboard" className="hover:text-emerald-700">{year.org.name}</Link>
        {" · "}Year ended {year.endDate.toISOString().slice(0, 10)}
      </div>
      <StepNav
        yearId={year.id}
        badges={{ categorise: uncategorised, upload: unverified }}
      />
      <div className="mt-6">{children}</div>
    </div>
  );
}
