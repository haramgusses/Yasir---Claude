import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireYear, isoDate } from "@/lib/years";
import { suggestCategory } from "@/lib/categorise/rules";
import { TIER3_CATEGORIES } from "@/lib/compliance/categories";
import CategoriseTable from "@/components/categorise/CategoriseTable";

export const dynamic = "force-dynamic";

export default async function CategorisePage({ params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) notFound();

  const [lines, categories] = await Promise.all([
    prisma.sourceTransaction.findMany({
      where: {
        batch: { yearId: year.id },
        reversalOfId: null,
        reversedBy: null,
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        amountCents: true,
        payee: true,
        particulars: true,
        reference: true,
        isTransfer: true,
        importedCategory: true,
        splits: {
          select: {
            categoryId: true,
            category: { select: { name: true } },
            funder: { select: { name: true } },
          },
        },
      },
    }),
    prisma.category.findMany({
      where: { orgId: year.orgId, archived: false },
      orderBy: { name: "asc" },
      select: { id: true, name: true, complianceCode: true },
    }),
  ]);

  const rows = lines.map((l) => {
    const split = l.splits[0] ?? null;
    const base = {
      id: l.id,
      date: isoDate(l.date),
      amountCents: l.amountCents,
      payee: l.payee ?? "",
      particulars: l.particulars ?? "",
      isTransfer: l.isTransfer,
      fromFile: !!l.importedCategory,
      categoryId: split?.categoryId ?? null,
      categoryName: split?.category?.name ?? null,
      funderName: split?.funder?.name ?? null,
    };
    // Suggest only for lines still uncategorised (and never for transfers).
    const suggestion =
      !split && !l.isTransfer
        ? suggestCategory({
            amountCents: l.amountCents,
            payee: base.payee,
            particulars: base.particulars,
            reference: l.reference ?? "",
            importedCategory: l.importedCategory,
          })
        : null;
    return {
      ...base,
      suggestion: suggestion
        ? {
            categoryName: suggestion.categoryName,
            complianceCode: suggestion.complianceCode,
            confidence: suggestion.confidence,
            rationale: suggestion.rationale,
          }
        : null,
    };
  });

  return (
    <CategoriseTable
      yearId={year.id}
      rows={rows}
      categories={categories}
      complianceOptions={TIER3_CATEGORIES.map((c) => ({
        code: c.code,
        label: c.label,
        funderPrompt: !!c.funderPrompt,
      }))}
    />
  );
}
