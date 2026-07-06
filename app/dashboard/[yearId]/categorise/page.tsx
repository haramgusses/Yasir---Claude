import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireYear, isoDate } from "@/lib/years";
import { suggestCategory, groupByPayee } from "@/lib/categorise/rules";
import { TIER3_CATEGORIES } from "@/lib/compliance/categories";
import CategoriseQueue from "@/components/categorise/CategoriseQueue";

export const dynamic = "force-dynamic";

export default async function CategorisePage({ params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) notFound();

  const [lines, categories, doneSplits] = await Promise.all([
    prisma.sourceTransaction.findMany({
      where: {
        batch: { yearId: year.id },
        isTransfer: false,
        reversalOfId: null,
        reversedBy: null,
        splits: { none: {} },
      },
      orderBy: { date: "asc" },
      select: { id: true, date: true, amountCents: true, payee: true, particulars: true, reference: true },
    }),
    prisma.category.findMany({
      where: { orgId: year.orgId, archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, complianceCode: true },
    }),
    prisma.transactionSplit.findMany({
      where: { source: { batch: { yearId: year.id } } },
      select: {
        amountCents: true,
        category: { select: { name: true } },
        funder: { select: { name: true } },
        source: { select: { id: true, payee: true, particulars: true } },
      },
    }),
  ]);

  const groups = [...groupByPayee(
    lines.map((l) => ({
      id: l.id,
      date: isoDate(l.date),
      amountCents: l.amountCents,
      payee: l.payee ?? "",
      particulars: l.particulars ?? "",
      reference: l.reference ?? "",
    }))
  ).entries()].map(([key, ls]) => {
    const suggestion = suggestCategory(ls[0]);
    return {
      key,
      lines: ls,
      totalCents: ls.reduce((a, l) => a + l.amountCents, 0),
      suggestion,
    };
  });
  groups.sort((a, b) => Math.abs(b.totalCents) - Math.abs(a.totalCents));

  // What's already sorted, grouped category → payee, with source ids so any
  // group can be undone back into the queue.
  const doneByKey = new Map<
    string,
    { category: string; payee: string; funder: string | null; sourceIds: string[]; totalCents: number }
  >();
  for (const s of doneSplits) {
    const categoryName = s.category?.name ?? "(uncategorised)";
    const payee = (s.source.payee || s.source.particulars || "(no description)")
      .toUpperCase()
      .replace(/\d{2,}/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const key = `${categoryName}|${payee}`;
    const entry =
      doneByKey.get(key) ??
      { category: categoryName, payee, funder: s.funder?.name ?? null, sourceIds: [], totalCents: 0 };
    entry.sourceIds.push(s.source.id);
    entry.totalCents += s.amountCents;
    doneByKey.set(key, entry);
  }
  const doneGroups = [...doneByKey.values()].sort(
    (a, b) => a.category.localeCompare(b.category) || Math.abs(b.totalCents) - Math.abs(a.totalCents)
  );

  return (
    <CategoriseQueue
      yearId={year.id}
      groups={groups}
      categories={categories}
      complianceOptions={TIER3_CATEGORIES.map((c) => ({
        code: c.code,
        label: c.label,
        funderPrompt: !!c.funderPrompt,
      }))}
      doneGroups={doneGroups}
    />
  );
}
