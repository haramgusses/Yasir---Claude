import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireYear, isoDate } from "@/lib/years";
import { coverageGaps } from "@/lib/import/verify";
import { detectTier, type PriorSpendBand } from "@/lib/compliance/tierDetection";
import { equivalentCode } from "@/lib/compliance/starterPacks";
import { buildStatementModel, type CategorisedSplit } from "@/lib/statements/model";
import PrintButton from "@/components/workspace/PrintButton";

export const dynamic = "force-dynamic";

const nzd = (cents: number) =>
  (cents / 100).toLocaleString("en-NZ", { style: "currency", currency: "NZD" });

export default async function ReviewPage({ params }: { params: { yearId: string } }) {
  const year = await requireYear(params.yearId);
  if (!year) notFound();

  const [splits, uncategorised, unverifiedBatches, batches, accounts, answers] =
    await Promise.all([
      prisma.transactionSplit.findMany({
        where: { source: { batch: { yearId: year.id }, isTransfer: false } },
        include: {
          category: { select: { name: true, complianceCode: true } },
          funder: { select: { name: true } },
          source: { select: { isTransfer: true } },
        },
      }),
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
      prisma.importBatch.findMany({
        where: { yearId: year.id },
        select: { accountId: true, periodStart: true, periodEnd: true },
      }),
      prisma.bankAccount.findMany({
        where: { orgId: year.orgId, imports: { some: { yearId: year.id } } },
        select: { id: true, name: true },
      }),
      prisma.interviewAnswer.findMany({ where: { yearId: year.id } }),
    ]);

  // --- Tier detection: computed, never asked (PLAN §7) ---
  const paymentsCents = splits
    .filter((s) => s.amountCents < 0)
    .reduce((a, s) => a - s.amountCents, 0);
  const publicAccountability =
    (answers.find((a) => a.questionKey === "public_accountability")?.answer as { value?: boolean } | null)
      ?.value ?? false;
  const tierResult = detectTier({
    operatingPaymentsCents: paymentsCents,
    priorSpendBand: (year.priorYearSpendBand ?? "UNSURE") as PriorSpendBand,
    hasPublicAccountability: publicAccountability,
    optUpToTier3: year.tierOverride === "TIER_3",
  });
  if (year.detectedTier !== tierResult.tier) {
    await prisma.financialYear.update({
      where: { id: year.id },
      data: { detectedTier: tierResult.tier },
    });
  }

  // --- Statement model (Layer-2 codes converted to the detected tier) ---
  const modelSplits: CategorisedSplit[] = splits.map((s) => ({
    complianceCode: equivalentCode(s.category!.complianceCode, tierResult.tier),
    categoryName: s.category!.name,
    amountCents: s.amountCents,
    funderName: s.funder?.name,
  }));
  const model = buildStatementModel({ tier: tierResult.tier, splits: modelSplits });

  // --- Readiness checks (PLAN §6.7) ---
  const yearStart = isoDate(year.startDate);
  const yearEnd = isoDate(year.endDate);
  const gapsByAccount = accounts
    .map((a) => ({
      name: a.name,
      gaps: coverageGaps(
        yearStart,
        yearEnd,
        batches
          .filter((b) => b.accountId === a.id && b.periodStart && b.periodEnd)
          .map((b) => ({ start: isoDate(b.periodStart!), end: isoDate(b.periodEnd!) }))
      ),
    }))
    .filter((a) => a.gaps.length > 0);

  const blockers: string[] = [];
  const warnings: string[] = [...tierResult.warnings, ...model.warnings];
  if (accounts.length === 0) blockers.push("No bank statements uploaded yet.");
  if (uncategorised > 0)
    blockers.push(`${uncategorised} transactions still need a category.`);
  if (unverifiedBatches > 0)
    blockers.push(
      `${unverifiedBatches} statement upload(s) haven't passed the balance check — enter opening and closing balances on the Upload step.`
    );
  for (const a of gapsByAccount)
    blockers.push(
      `"${a.name}" has missing periods: ${a.gaps.map((g) => `${g.fromDate} to ${g.toDate}`).join(", ")}.`
    );
  if (model.notes.funders.untaggedCents > 0)
    warnings.push(
      `${nzd(model.notes.funders.untaggedCents)} of grants/donations has no funder recorded — funders expect to see themselves named in the grants note.`
    );

  const ready = blockers.length === 0;

  return (
    <div className="space-y-6">
      {/* Tier explanation — a conclusion with reasons, not a question */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 print:hidden">
        <div className="text-sm font-semibold text-slate-900">
          Your report format:{" "}
          {tierResult.tier === "TIER_4"
            ? "Tier 4 — simple cash reporting"
            : "Tier 3 — accrual reporting"}
          {tierResult.optedUp ? " (chosen)" : ""}
        </div>
        <ul className="mt-1 text-xs text-slate-600 list-disc pl-4 space-y-0.5">
          {tierResult.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </div>

      {/* Readiness checklist */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            {ready ? "Ready to print your draft" : "Before your report is ready"}
          </h2>
          <PrintButton disabled={!ready} />
        </div>
        {blockers.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {blockers.map((m) => (
              <li key={m} className="text-sm text-red-700 flex gap-2">
                <span aria-hidden>●</span> {m}
              </li>
            ))}
          </ul>
        )}
        {warnings.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {warnings.map((m) => (
              <li key={m} className="text-sm text-amber-700 flex gap-2">
                <span aria-hidden>▲</span> {m}
              </li>
            ))}
          </ul>
        )}
        {ready && warnings.length === 0 && (
          <p className="mt-2 text-sm text-emerald-700">
            All checks pass. This draft still needs your committee&apos;s approval and
            signatures before filing.
          </p>
        )}
      </div>

      {/* Statement preview */}
      <div className="rounded-xl border border-slate-200 bg-white p-8 print:border-0 print:p-0">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">{year.org.name}</h1>
          <p className="text-sm text-slate-600 mt-1">
            {tierResult.tier === "TIER_4"
              ? "Statement of Cash Received and Cash Paid"
              : "Statement of Financial Performance"}
          </p>
          <p className="text-xs text-slate-500">
            For the year ended {yearEnd}
            {!ready && " — DRAFT, checks outstanding"}
          </p>
        </div>

        {model.sections.map((section) => (
          <div key={section.title} className="mt-8">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-300 pb-1">
              {section.title}
            </h3>
            <table className="w-full mt-2 text-sm">
              <tbody>
                {section.rows.map((row) => (
                  <tr key={row.complianceCode} className="align-top">
                    <td className="py-1.5 text-slate-800">
                      {row.label}
                      {row.breakdown.length > 1 && (
                        <div className="text-xs text-slate-500">
                          {row.breakdown.map((b) => b.name).join(" · ")}
                        </div>
                      )}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-slate-900 w-36">
                      {nzd(row.amountCents)}
                    </td>
                  </tr>
                ))}
                <tr className="border-t border-slate-300 font-semibold">
                  <td className="py-1.5 text-slate-900">Total {section.title.toLowerCase()}</td>
                  <td className="py-1.5 text-right tabular-nums">{nzd(section.totalCents)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        <div className="mt-6 border-t-2 border-slate-800 pt-2 flex justify-between text-sm font-semibold text-slate-900">
          <span>
            {model.surplusDeficitCents >= 0 ? "Surplus" : "Deficit"} for the year
          </span>
          <span className="tabular-nums">{nzd(model.surplusDeficitCents)}</span>
        </div>

        {model.notes.funders.rows.length > 0 && (
          <div className="mt-10">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-300 pb-1">
              Note 1 — {model.notes.funders.title}
            </h3>
            <table className="w-full mt-2 text-sm">
              <tbody>
                {model.notes.funders.rows.map((r) => (
                  <tr key={r.funder}>
                    <td className="py-1 text-slate-800">{r.funder}</td>
                    <td className="py-1 text-right tabular-nums w-36">{nzd(r.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-10 text-xs text-slate-400 print:text-slate-500">
          Draft prepared from verified bank transactions. The complete performance
          report (entity information, statement of service performance, financial
          position and notes) is assembled at export — coming in the next build stage.
        </p>
      </div>
    </div>
  );
}
