// Statement model builder (docs/PLAN.md §6.5): a pure function from
// categorised data to the JSON model the renderers (HTML/PDF/DOCX) consume.
// No generative step anywhere near the numbers. v0 scope: full Tier 4
// statement; Tier 3 Statement of Financial Performance from cash legs +
// adjustment journals. Position/cash-flow assembly extends the same shapes.

import { categoriesForTier, complianceCategory, type Tier } from "../compliance/categories";

export interface CategorisedSplit {
  complianceCode: string;
  categoryName: string; // Layer-2 name
  amountCents: number; // signed; positive = money in
  funderName?: string;
  isTransfer?: boolean;
}

export interface JournalLineInput {
  complianceCode: string; // revenue/expense codes affect performance
  amountCents: number; // signed, revenue positive / expense negative
}

export interface StatementRow {
  complianceCode: string;
  label: string;
  amountCents: number;
  comparativeCents?: number;
  /** Layer-2 breakdown for the notes (PLAN §5: detail lives in notes). */
  breakdown: { name: string; amountCents: number }[];
}

export interface StatementSection {
  title: string;
  rows: StatementRow[];
  totalCents: number;
  comparativeTotalCents?: number;
}

export interface FundersNote {
  title: string;
  rows: { funder: string; amountCents: number }[];
  untaggedCents: number;
}

export interface StatementModel {
  tier: Tier;
  sections: StatementSection[];
  surplusDeficitCents: number;
  notes: { funders: FundersNote };
  warnings: string[];
}

function aggregate(
  splits: CategorisedSplit[],
  codes: string[],
  comparatives?: Record<string, number>
): StatementRow[] {
  const byCode = new Map<string, Map<string, number>>();
  for (const s of splits) {
    if (s.isTransfer) continue;
    if (!codes.includes(s.complianceCode)) continue;
    const inner = byCode.get(s.complianceCode) ?? new Map<string, number>();
    inner.set(s.categoryName, (inner.get(s.categoryName) ?? 0) + s.amountCents);
    byCode.set(s.complianceCode, inner);
  }
  // Every minimum category renders, in standard order, even when zero —
  // except zero rows with no comparative, which the standards let us omit.
  return codes
    .map((code) => {
      const inner = byCode.get(code) ?? new Map<string, number>();
      const amountCents = [...inner.values()].reduce((a, b) => a + b, 0);
      const comparativeCents = comparatives?.[code];
      return {
        complianceCode: code,
        label: complianceCategory(code).label,
        amountCents,
        ...(comparativeCents !== undefined ? { comparativeCents } : {}),
        breakdown: [...inner.entries()]
          .map(([name, cents]) => ({ name, amountCents: cents }))
          .sort((a, b) => Math.abs(b.amountCents) - Math.abs(a.amountCents)),
      };
    })
    .filter((row) => row.amountCents !== 0 || row.comparativeCents !== undefined);
}

function section(
  title: string,
  rows: StatementRow[],
  sign: 1 | -1
): StatementSection {
  // Present magnitudes; the section knows its direction.
  const presented = rows.map((r) => ({
    ...r,
    amountCents: sign * r.amountCents,
    ...(r.comparativeCents !== undefined ? { comparativeCents: sign * r.comparativeCents } : {}),
  }));
  const totalCents = presented.reduce((a, r) => a + r.amountCents, 0);
  const comparativeTotalCents = rows.some((r) => r.comparativeCents !== undefined)
    ? presented.reduce((a, r) => a + (r.comparativeCents ?? 0), 0)
    : undefined;
  return { title, rows: presented, totalCents, ...(comparativeTotalCents !== undefined ? { comparativeTotalCents } : {}) };
}

function fundersNote(splits: CategorisedSplit[], grantCodes: string[]): FundersNote {
  const byFunder = new Map<string, number>();
  let untagged = 0;
  for (const s of splits) {
    if (!grantCodes.includes(s.complianceCode)) continue;
    if (s.funderName) byFunder.set(s.funderName, (byFunder.get(s.funderName) ?? 0) + s.amountCents);
    else untagged += s.amountCents;
  }
  return {
    title: "Grants and donations by funder",
    rows: [...byFunder.entries()]
      .map(([funder, amountCents]) => ({ funder, amountCents }))
      .sort((a, b) => b.amountCents - a.amountCents),
    untaggedCents: untagged,
  };
}

/**
 * Build the statement model. For Tier 4 pass only cash splits; for Tier 3
 * pass cash splits plus journal lines (already signed the same way).
 */
export function buildStatementModel(input: {
  tier: Tier;
  splits: CategorisedSplit[];
  journalLines?: JournalLineInput[];
  comparatives?: Record<string, number>;
}): StatementModel {
  const { tier, comparatives } = input;
  const warnings: string[] = [];
  const all: CategorisedSplit[] = [
    ...input.splits,
    ...(input.journalLines ?? []).map((j) => ({
      complianceCode: j.complianceCode,
      categoryName: "Year-end adjustments",
      amountCents: j.amountCents,
    })),
  ];

  const codes = categoriesForTier(tier).map((c) => c.code);
  const inCodes = codes.filter((c) => {
    const s = complianceCategory(c).section;
    return s === "REVENUE" || s === "CASH_RECEIVED";
  });
  const outCodes = codes.filter((c) => {
    const s = complianceCategory(c).section;
    return s === "EXPENSE" || s === "CASH_PAID";
  });

  const inSection = section(
    tier === "TIER_4" ? "Cash received" : "Revenue",
    aggregate(all, inCodes, comparatives),
    1
  );
  const outSection = section(
    tier === "TIER_4" ? "Cash paid" : "Expenses",
    aggregate(all, outCodes, comparatives),
    -1
  );

  // Sanity warnings (feed the validation engine, PLAN §6.7).
  for (const row of [...inSection.rows, ...outSection.rows]) {
    if (row.amountCents < 0) {
      warnings.push(`"${row.label}" is negative — check for miscategorised transactions.`);
    }
  }

  const grantCodes = codes.filter((c) => complianceCategory(c).funderPrompt);
  return {
    tier,
    sections: [inSection, outSection],
    surplusDeficitCents: inSection.totalCents - outSection.totalCents,
    notes: { funders: fundersNote(all, grantCodes) },
    warnings,
  };
}
