// Layer 1: fixed minimum compliance categories per the XRB Tier 3 (NFP) and
// Tier 4 (NFP) Standards (mandatory for periods beginning on/after 1 Apr 2024).
// These are the rows of the generated statements. Layer-2 user categories map
// to exactly one of these codes (see docs/PLAN.md §5).
//
// NOTE: labels below are drafted from Charities Services / XRB guidance and
// MUST be reconciled word-for-word against the standards' full text before
// release (docs/PLAN.md §2.9.1).

export type Tier = "TIER_3" | "TIER_4";
export type StatementSection =
  | "REVENUE"
  | "EXPENSE"
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "CASH_RECEIVED"
  | "CASH_PAID";

export interface ComplianceCategory {
  code: string;
  tier: Tier;
  section: StatementSection;
  label: string; // plain-language-first label shown to users
  /** True when categorising into this code should trigger the funder question */
  funderPrompt?: boolean;
  /** True when the documented-expectations / capital-grant follow-ups apply */
  grantFollowUps?: boolean;
}

export const TIER3_CATEGORIES: ComplianceCategory[] = [
  // Statement of Financial Performance — revenue (minimum categories)
  { code: "T3_REV_DONATIONS", tier: "TIER_3", section: "REVENUE", label: "Donations, koha, bequests and fundraising", funderPrompt: true },
  { code: "T3_REV_GRANTS_GENERAL", tier: "TIER_3", section: "REVENUE", label: "Grants received for general funding", funderPrompt: true, grantFollowUps: true },
  { code: "T3_REV_GRANTS_CAPITAL", tier: "TIER_3", section: "REVENUE", label: "Grants/donations for buying or building a significant asset", funderPrompt: true, grantFollowUps: true },
  { code: "T3_REV_GOODS_SERVICES", tier: "TIER_3", section: "REVENUE", label: "Revenue from providing goods or services" },
  { code: "T3_REV_MEMBERS", tier: "TIER_3", section: "REVENUE", label: "Fees, subscriptions and other revenue from members" },
  { code: "T3_REV_INVESTMENT", tier: "TIER_3", section: "REVENUE", label: "Interest, dividends and other investment revenue" },
  { code: "T3_REV_OTHER", tier: "TIER_3", section: "REVENUE", label: "Other revenue" },
  // Expenses (employee vs volunteer costs split under the new standard)
  { code: "T3_EXP_EMPLOYEE", tier: "TIER_3", section: "EXPENSE", label: "Employee related costs" },
  { code: "T3_EXP_VOLUNTEER", tier: "TIER_3", section: "EXPENSE", label: "Volunteer related costs" },
  { code: "T3_EXP_GOODS_SERVICES", tier: "TIER_3", section: "EXPENSE", label: "Costs of providing goods or services" },
  { code: "T3_EXP_GRANTS_MADE", tier: "TIER_3", section: "EXPENSE", label: "Grants and donations made" },
  { code: "T3_EXP_OTHER", tier: "TIER_3", section: "EXPENSE", label: "Other expenses" },
];

export const TIER4_CATEGORIES: ComplianceCategory[] = [
  // Statement of Cash Received and Cash Paid (new Tier 4 standard)
  { code: "T4_IN_DONATIONS", tier: "TIER_4", section: "CASH_RECEIVED", label: "Donations, koha, fundraising and grants", funderPrompt: true, grantFollowUps: true },
  { code: "T4_IN_MEMBERS", tier: "TIER_4", section: "CASH_RECEIVED", label: "Fees, subscriptions and other money from members" },
  { code: "T4_IN_GOODS_SERVICES", tier: "TIER_4", section: "CASH_RECEIVED", label: "Money from providing goods or services" },
  { code: "T4_IN_INVESTMENT", tier: "TIER_4", section: "CASH_RECEIVED", label: "Interest, dividends and other investment income" },
  { code: "T4_IN_OTHER", tier: "TIER_4", section: "CASH_RECEIVED", label: "Other money received" },
  { code: "T4_OUT_EMPLOYEE", tier: "TIER_4", section: "CASH_PAID", label: "Payments to employees and volunteers" },
  { code: "T4_OUT_GOODS_SERVICES", tier: "TIER_4", section: "CASH_PAID", label: "Payments for goods or services" },
  { code: "T4_OUT_GRANTS_MADE", tier: "TIER_4", section: "CASH_PAID", label: "Grants and donations paid out" },
  { code: "T4_OUT_OTHER", tier: "TIER_4", section: "CASH_PAID", label: "Other money paid" },
];

const ALL = [...TIER3_CATEGORIES, ...TIER4_CATEGORIES];
const byCode = new Map(ALL.map((c) => [c.code, c]));

export function complianceCategory(code: string): ComplianceCategory {
  const c = byCode.get(code);
  if (!c) throw new Error(`Unknown compliance category code: ${code}`);
  return c;
}

export function categoriesForTier(tier: Tier): ComplianceCategory[] {
  return tier === "TIER_3" ? TIER3_CATEGORIES : TIER4_CATEGORIES;
}

/** Validate a Layer-2 → Layer-1 mapping at write time. */
export function isValidComplianceCode(code: string, tier: Tier): boolean {
  const c = byCode.get(code);
  return !!c && c.tier === tier;
}
