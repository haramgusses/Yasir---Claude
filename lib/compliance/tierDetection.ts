// Reporting tier detection and statutory assurance thresholds.
// Sources: docs/PLAN.md §2.1, §2.6, §7. Thresholds verified June 2026:
//  - Tier 4: total operating payments < $140,000 ("specified not-for-profit
//    entity" line, measured against EACH of the two preceding periods)
//  - Tier 3: total expenses <= $5,000,000 and no public accountability
//  - Review: opex >= $550,000; Audit: opex >= $1,100,000 (each of the two
//    preceding financial years, Charities Act ss 42C-42D)
// Design rule (PLAN §3.5): the tool states conclusions with reasons; these
// functions return plain-language reasons alongside every determination.

import type { Tier } from "./categories";

export const TIER4_OPERATING_PAYMENTS_LIMIT_CENTS = 140_000_00;
export const TIER3_TOTAL_EXPENSES_LIMIT_CENTS = 5_000_000_00;
export const REVIEW_OPEX_THRESHOLD_CENTS = 550_000_00;
export const AUDIT_OPEX_THRESHOLD_CENTS = 1_100_000_00;

/** How close (proportionally) to a threshold before we warn. */
const NEAR_THRESHOLD_RATIO = 0.9;

/** Rough setup answer about each of the two preceding years' spending. */
export type PriorSpendBand = "UNDER_140K" | "OVER_140K" | "UNSURE" | "FIRST_YEAR";

export interface TierInput {
  /** Total operating payments for the current year, from categorised cash data. */
  operatingPaymentsCents: number;
  /** Total expenses (accrual) if known; falls back to payments for provisional checks. */
  totalExpensesCents?: number;
  /** Setup question: prior two years' spending relative to $140k. */
  priorSpendBand: PriorSpendBand;
  /** Plain-language screening question outcome (rare for community orgs). */
  hasPublicAccountability: boolean;
  /** Optional user choice to report a tier up (Tier 4-eligible choosing Tier 3). */
  optUpToTier3?: boolean;
}

export interface TierResult {
  tier: Tier;
  /** True when the entity could use Tier 4 but is reporting Tier 3 by choice. */
  optedUp: boolean;
  /** Plain-language reasons shown to the user ("why this format?"). */
  reasons: string[];
  /** Non-blocking cautions (near thresholds, unsure answers). */
  warnings: string[];
  /** True when the entity exceeds Tier 3 limits and needs Tier 2 (out of scope). */
  exceedsTier3: boolean;
}

export function detectTier(input: TierInput): TierResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const payments = input.operatingPaymentsCents;
  const expenses = input.totalExpensesCents ?? payments;

  if (input.hasPublicAccountability || expenses > TIER3_TOTAL_EXPENSES_LIMIT_CENTS) {
    return {
      tier: "TIER_3",
      optedUp: false,
      reasons: [
        input.hasPublicAccountability
          ? "Your organisation holds money on behalf of others in a way that requires a higher reporting tier."
          : "Total expenses are above the $5 million Tier 3 limit.",
        "This is outside what this tool can prepare — talk to an accountant about Tier 1/2 reporting.",
      ],
      warnings,
      exceedsTier3: true,
    };
  }

  // Tier 4 eligibility: under $140k operating payments. The statutory test
  // looks at each of the two preceding periods; a first-year entity or one
  // under the line in either preceding year is not yet a "specified
  // not-for-profit entity".
  const currentUnderLimit = payments < TIER4_OPERATING_PAYMENTS_LIMIT_CENTS;
  const priorOk =
    input.priorSpendBand === "UNDER_140K" || input.priorSpendBand === "FIRST_YEAR";
  const tier4Eligible = currentUnderLimit && (priorOk || input.priorSpendBand === "UNSURE");

  if (input.priorSpendBand === "UNSURE" && currentUnderLimit) {
    warnings.push(
      "You weren't sure about the last two years' spending. If it was $140,000 or more in both years, the fuller Tier 3 format applies — check last year's records before filing."
    );
  }
  if (
    currentUnderLimit &&
    payments >= TIER4_OPERATING_PAYMENTS_LIMIT_CENTS * NEAR_THRESHOLD_RATIO
  ) {
    warnings.push(
      "Spending is close to the $140,000 line. If it stays this high, next year's report will likely need the fuller Tier 3 format."
    );
  }

  if (tier4Eligible && !input.optUpToTier3) {
    reasons.push(
      `Total operating payments of ${formatNZD(payments)} are under the $140,000 limit, so the simple cash-based Tier 4 format applies.`
    );
    return { tier: "TIER_4", optedUp: false, reasons, warnings, exceedsTier3: false };
  }

  if (tier4Eligible && input.optUpToTier3) {
    reasons.push(
      "Your organisation qualifies for the simple Tier 4 format but has chosen to prepare the fuller Tier 3 (accrual) report. That's allowed — you can always report a tier up."
    );
    return { tier: "TIER_3", optedUp: true, reasons, warnings, exceedsTier3: false };
  }

  reasons.push(
    currentUnderLimit
      ? "Operating payments were $140,000 or more in each of the last two years, so the Tier 3 (accrual) format applies."
      : `Total operating payments of ${formatNZD(payments)} are $140,000 or more, so the Tier 3 (accrual) format applies.`
  );
  if (expenses >= TIER3_TOTAL_EXPENSES_LIMIT_CENTS * NEAR_THRESHOLD_RATIO) {
    warnings.push(
      "Total expenses are close to the $5 million Tier 3 limit. Above that, Tier 2 reporting applies, which this tool does not prepare."
    );
  }
  return { tier: "TIER_3", optedUp: false, reasons, warnings, exceedsTier3: false };
}

export type AssuranceLevel = "NONE" | "REVIEW_OR_AUDIT" | "AUDIT";

export interface AssuranceResult {
  level: AssuranceLevel;
  reasons: string[];
}

/**
 * Statutory assurance requirement for registered charities, based on total
 * operating expenditure in each of the two preceding financial years.
 * Non-charity societies: no general statutory requirement, but constitutions
 * often impose one — callers should also check the interview answer.
 */
export function assuranceRequirement(
  precedingYearOpexCents: number,
  yearBeforeThatOpexCents: number,
  isRegisteredCharity: boolean
): AssuranceResult {
  if (!isRegisteredCharity) {
    return {
      level: "NONE",
      reasons: [
        "No statutory audit or review applies, but check your constitution — many require one.",
      ],
    };
  }
  const both = (t: number) =>
    precedingYearOpexCents >= t && yearBeforeThatOpexCents >= t;

  if (both(AUDIT_OPEX_THRESHOLD_CENTS)) {
    return {
      level: "AUDIT",
      reasons: [
        "Total operating expenditure was $1.1 million or more in each of the last two financial years, so the performance report must be audited by a qualified auditor.",
      ],
    };
  }
  if (both(REVIEW_OPEX_THRESHOLD_CENTS)) {
    return {
      level: "REVIEW_OR_AUDIT",
      reasons: [
        "Total operating expenditure was $550,000 or more in each of the last two financial years, so the performance report must be reviewed or audited by a qualified auditor.",
      ],
    };
  }
  return {
    level: "NONE",
    reasons: [
      "Below the statutory review threshold ($550,000 in each of the last two years). A funder or your constitution may still require a review or audit.",
    ],
  };
}

export function formatNZD(cents: number): string {
  return (cents / 100).toLocaleString("en-NZ", {
    style: "currency",
    currency: "NZD",
    maximumFractionDigits: 0,
  });
}
