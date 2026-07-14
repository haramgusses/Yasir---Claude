import { notFound } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Scale, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireYear, isoDate, monthlyFlow } from "@/lib/years";
import MonthlyFlow from "@/components/viz/MonthlyFlow";
import CategoryBars from "@/components/viz/CategoryBars";
import { coverageGaps } from "@/lib/import/verify";
import { detectTier, type PriorSpendBand } from "@/lib/compliance/tierDetection";
import { equivalentCode } from "@/lib/compliance/starterPacks";
import { buildStatementModel, type CategorisedSplit } from "@/lib/statements/model";
import { nzd } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import PrintButton from "@/components/workspace/PrintButton";

export const dynamic = "force-dynamic";

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

  // Backstops: accounts with nothing uploaded this year, and transactions
  // allocated more than once (a double-click race slipping past the
  // client-side serialisation) — both would silently distort the numbers.
  const [allAccounts, doubleAllocated] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { orgId: year.orgId },
      select: { id: true, name: true },
    }),
    prisma.transactionSplit.groupBy({
      by: ["sourceId"],
      where: { source: { batch: { yearId: year.id } } },
      having: { sourceId: { _count: { gt: 1 } } },
      _count: true,
    }),
  ]);
  const accountsWithoutUploads = allAccounts.filter(
    (a) => !accounts.some((x) => x.id === a.id)
  );

  // Tier detection — computed, never asked (PLAN §7).
  const paymentsCents = splits
    .filter((s) => s.amountCents < 0)
    .reduce((a, s) => a - s.amountCents, 0);
  const publicAccountability =
    (answers.find((a) => a.questionKey === "public_accountability")?.answer as
      | { value?: boolean }
      | null)?.value ?? false;
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

  const modelSplits: CategorisedSplit[] = splits.map((s) => ({
    complianceCode: equivalentCode(s.category!.complianceCode, tierResult.tier),
    categoryName: s.category!.name,
    amountCents: s.amountCents,
    funderName: s.funder?.name,
  }));
  const model = buildStatementModel({ tier: tierResult.tier, splits: modelSplits });

  // Readiness checks (PLAN §6.7).
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
  if (uncategorised > 0) blockers.push(`${uncategorised} transactions still need a category.`);
  if (unverifiedBatches > 0)
    blockers.push(
      `${unverifiedBatches} statement upload(s) haven't passed the balance check — enter opening and closing balances on the Upload step.`
    );
  for (const a of gapsByAccount)
    blockers.push(
      `"${a.name}" has missing periods: ${a.gaps.map((g) => `${g.fromDate} to ${g.toDate}`).join(", ")}.`
    );
  if (doubleAllocated.length > 0)
    blockers.push(
      `${doubleAllocated.length} transaction(s) were categorised twice (usually a double-click). Open Categorise → Sorted, undo the affected group, and apply it once.`
    );
  for (const a of accountsWithoutUploads)
    warnings.push(
      `No statements uploaded for "${a.name}" this year — if that account had any activity, its transactions are missing from this report.`
    );
  if (model.notes.funders.untaggedCents > 0)
    warnings.push(
      `${nzd(model.notes.funders.untaggedCents)} of grants/donations has no funder recorded — funders expect to see themselves named in the grants note.`
    );

  const ready = blockers.length === 0;
  const inTotal = model.sections[0]?.totalCents ?? 0;
  const outTotal = model.sections[1]?.totalCents ?? 0;

  // Chart data: monthly cash flow + per-category magnitudes (already
  // presented as positive magnitudes by the statement model).
  const months = (await monthlyFlow(year.id, year.startDate, year.endDate)).map((b) => ({
    label: b.label,
    full: b.full,
    inCents: b.inCents,
    outCents: b.outCents,
  }));
  const revenueRows = (model.sections[0]?.rows ?? [])
    .map((r) => ({ label: r.label, cents: r.amountCents }))
    .sort((a, b) => b.cents - a.cents);
  const expenseRows = (model.sections[1]?.rows ?? [])
    .map((r) => ({ label: r.label, cents: r.amountCents }))
    .sort((a, b) => b.cents - a.cents);

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 print:hidden">
        <StatCard icon={ArrowDownLeft} label="Money in" value={nzd(inTotal)} tone="in" />
        <StatCard icon={ArrowUpRight} label="Money out" value={nzd(outTotal)} tone="out" />
        <StatCard
          icon={Scale}
          label={model.surplusDeficitCents >= 0 ? "Surplus" : "Deficit"}
          value={nzd(Math.abs(model.surplusDeficitCents))}
          tone="net"
        />
      </div>

      {/* Year at a glance — interactive, screen-only */}
      {months.some((m) => m.inCents + m.outCents > 0) && (
        <Card className="space-y-8 p-5 print:hidden">
          <MonthlyFlow months={months} />
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <CategoryBars title="Where money came from" rows={revenueRows} hue="green" />
            <CategoryBars title="Where money went" rows={expenseRows} hue="plum" />
          </div>
        </Card>
      )}

      {/* Tier explanation — a conclusion with reasons, not a question */}
      <Card className="p-5 print:hidden">
        <div className="text-sm font-semibold text-ink">
          Your report format:{" "}
          {tierResult.tier === "TIER_4" ? "Tier 4 — simple cash reporting" : "Tier 3 — accrual reporting"}
          {tierResult.optedUp ? " (chosen)" : ""}
        </div>
        <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-ink-soft">
          {tierResult.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Card>

      {/* Readiness checklist */}
      <Card className="p-5 print:hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">
            {ready ? "Ready to print your draft" : "Before your report is ready"}
          </h2>
          <PrintButton disabled={!ready} />
        </div>
        <ul className="mt-3 space-y-2">
          {blockers.map((m) => (
            <li key={m} className="flex items-start gap-2 text-sm text-clay">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {m}
            </li>
          ))}
          {warnings.map((m) => (
            <li key={m} className="flex items-start gap-2 text-sm text-amberink">
              <Info className="mt-0.5 h-4 w-4 shrink-0" /> {m}
            </li>
          ))}
          {ready && warnings.length === 0 && (
            <li className="flex items-start gap-2 text-sm text-performa-green">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> All checks pass. This draft
              still needs your committee&apos;s approval and signatures before filing.
            </li>
          )}
        </ul>
      </Card>

      {/* Statement preview — rendered as physical paper on the dark UI */}
      <Card className="p-8 print:border-0 print:p-0 print:shadow-none">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-slate-900">{year.org.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
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
            <h3 className="border-b border-slate-300 pb-1 text-sm font-semibold text-slate-900">
              {section.title}
            </h3>
            <table className="mt-2 w-full text-sm">
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
                    <td className="w-36 py-1.5 text-right tabular-nums text-slate-900">
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

        <div className="mt-6 flex justify-between border-t-2 border-slate-800 pt-2 text-sm font-semibold text-slate-900">
          <span>{model.surplusDeficitCents >= 0 ? "Surplus" : "Deficit"} for the year</span>
          <span className="tabular-nums">{nzd(model.surplusDeficitCents)}</span>
        </div>

        {model.notes.funders.rows.length > 0 && (
          <div className="mt-10">
            <h3 className="border-b border-slate-300 pb-1 text-sm font-semibold text-slate-900">
              Note 1 — {model.notes.funders.title}
            </h3>
            <table className="mt-2 w-full text-sm">
              <tbody>
                {model.notes.funders.rows.map((r) => (
                  <tr key={r.funder}>
                    <td className="py-1 text-slate-800">{r.funder}</td>
                    <td className="w-36 py-1 text-right tabular-nums">{nzd(r.amountCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-10 text-xs text-slate-400 print:text-slate-500">
          Draft prepared from verified bank transactions. The complete performance report
          (entity information, statement of service performance, financial position and
          notes) is assembled at export — coming in the next build stage.
        </p>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Scale;
  label: string;
  value: string;
  tone: "in" | "out" | "net";
}) {
  const ring =
    tone === "in"
      ? "text-performa-green bg-performa-soft"
      : tone === "out"
        ? "text-ink-soft bg-surface-2"
        : "text-performa-green bg-performa-soft";
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${ring}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-[11px] uppercase tracking-wide text-ink-mute">{label}</div>
        <div className="text-lg font-semibold tabular-nums text-ink">{value}</div>
      </div>
    </Card>
  );
}
