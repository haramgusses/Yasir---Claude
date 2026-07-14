// Layer 1 of the suggestion engine: deterministic NZ payee/particulars rules
// (docs/PLAN.md §6.4). High confidence, still always confirmable by the user.
// Suggestions reference Tier 3 compliance codes; convert with
// equivalentCode() for Tier 4 organisations. Org memory and LLM suggestion
// layers build on the same RuleSuggestion shape.

export interface RuleSuggestion {
  complianceCode: string;
  /** Suggested Layer-2 category name (created if the org doesn't have it). */
  categoryName: string;
  confidence: number; // 0..1
  rationale: string;
  ruleKey: string;
}

interface Rule {
  key: string;
  /** Tested against payee + particulars + reference, upper-cased. */
  pattern: RegExp;
  /** Restrict to money in (+1), money out (-1), or either (0). */
  direction: 1 | -1 | 0;
  suggestion: Omit<RuleSuggestion, "ruleKey">;
}

const r = (
  key: string,
  pattern: RegExp,
  direction: 1 | -1 | 0,
  complianceCode: string,
  categoryName: string,
  confidence: number,
  rationale: string
): Rule => ({ key, pattern, direction, suggestion: { complianceCode, categoryName, confidence, rationale } });

const RULES: Rule[] = [
  // IRD — direction matters: PAYE out vs GST refunds in.
  r("ird-paye", /\b(IRD|INLAND REVENUE)\b.*\b(PAYE|EMP)\b|\b(PAYE)\b.*\b(IRD|INLAND REVENUE)\b/, -1,
    "T3_EXP_EMPLOYEE", "Wages and salaries", 0.95, "PAYE payment to Inland Revenue"),
  r("ird-gst-paid", /\b(IRD|INLAND REVENUE)\b.*\bGST\b|\bGST\b.*\b(IRD|INLAND REVENUE)\b/, -1,
    "T3_EXP_OTHER", "GST paid to IRD", 0.9, "GST payment to Inland Revenue — used to cross-check GST treatment"),
  r("ird-gst-refund", /\b(IRD|INLAND REVENUE)\b/, 1,
    "T3_REV_OTHER", "GST refund from IRD", 0.7, "Credit from Inland Revenue — likely a GST refund"),

  // Bank fees & interest.
  r("bank-fee", /\b(MONTHLY A\/?C FEE|ACCOUNT FEE|SERVICE FEE|BANK FEE|TRANSACTION FEE|DISHONOUR)\b/, -1,
    "T3_EXP_OTHER", "Bank fees", 0.95, "Bank fee line"),
  r("interest-in", /\bINTEREST\b/, 1,
    "T3_REV_INVESTMENT", "Interest received", 0.95, "Interest credited by the bank"),

  // Payroll providers.
  r("payroll-provider", /\b(SMARTLY|PAYSAUCE|IPAYROLL|PAYHERO|THANKYOU PAYROLL|CRYSTAL PAYROLL)\b/, -1,
    "T3_EXP_EMPLOYEE", "Wages and salaries", 0.9, "Payment via a payroll provider"),

  // Donation platforms.
  r("givealittle", /\b(GIVEALITTLE|GIVE A LITTLE)\b/, 1,
    "T3_REV_DONATIONS", "Donations and koha", 0.9, "Givealittle settlement — donations"),

  // Card / online settlement income.
  r("card-settlement", /\b(STRIPE|PAYSTATION|WINDCAVE|EFTPOS NZ|SQUARE)\b/, 1,
    "T3_REV_GOODS_SERVICES", "Income from activities", 0.7, "Card/online payment settlement"),

  // Common suppliers.
  r("insurance", /\b(AON|VERO|AMI|STATE INSURANCE|TOWER|NZI|FMG|ANDO)\b/, -1,
    "T3_EXP_GOODS_SERVICES", "Insurance", 0.85, "Payment to an insurer"),
  r("power", /\b(MERIDIAN|CONTACT ENERGY|GENESIS|MERCURY|NOVA ENERGY|ELECTRIC KIWI|POWERSHOP)\b/, -1,
    "T3_EXP_GOODS_SERVICES", "Power, phone and internet", 0.85, "Power company payment"),
  r("telco", /\b(SPARK|ONE NZ|VODAFONE|2DEGREES|SLINGSHOT|ORCON)\b/, -1,
    "T3_EXP_GOODS_SERVICES", "Power, phone and internet", 0.8, "Phone/internet provider payment"),
  r("council", /\bCOUNCIL\b/, -1,
    "T3_EXP_GOODS_SERVICES", "Rent and venue hire", 0.5, "Payment to a council — often venue hire or rates; please confirm"),
  r("accountant", /\b(XERO|MYOB|ACCOUNTANT|ACCOUNTING)\b/, -1,
    "T3_EXP_OTHER", "Accounting and audit", 0.6, "Accounting-related payment"),

  // Grant funders (credits) — funder question will follow (PLAN §5).
  r("grant-funder", /\b(LOTTERY|LOTTERIES|COGS|COMMUNITY ORGANISATION GRANTS|FOUNDATION NORTH|RATA FOUNDATION|TECT|NZCT|PUB CHARITY|LION FOUNDATION|GRASSROOTS TRUST|FOUR WINDS|TRUST WAIKATO|WEL ENERGY TRUST|CREATIVE NZ|CREATIVE NEW ZEALAND|SPORT NZ|DIA GRANT)\b/, 1,
    "T3_REV_GRANTS_GENERAL", "Grants — general", 0.9, "Credit from a known grant funder"),
];

export function suggestCategory(line: {
  amountCents: number;
  payee: string;
  particulars: string;
  reference: string;
  importedCategory?: string | null;
}): RuleSuggestion | null {
  // A category the user's own file carried beats any pattern rule: they (or
  // their previous tool) already made this call — we carry it over and map
  // it onto the nearest compliance code.
  if (line.importedCategory?.trim()) {
    const name = line.importedCategory.trim();
    const mapped = suggestCategory({ ...line, importedCategory: null, particulars: `${line.particulars} ${name}` });
    return {
      complianceCode:
        mapped?.complianceCode ??
        (line.amountCents >= 0 ? "T3_REV_OTHER" : "T3_EXP_OTHER"),
      categoryName: name,
      confidence: 0.95,
      rationale: "Carried over from a category column in your file",
      ruleKey: "imported-category",
    };
  }
  const haystack = `${line.payee} ${line.particulars} ${line.reference}`.toUpperCase();
  const dir = line.amountCents >= 0 ? 1 : -1;
  for (const rule of RULES) {
    if (rule.direction !== 0 && rule.direction !== dir) continue;
    if (rule.pattern.test(haystack)) {
      return { ...rule.suggestion, ruleKey: rule.key };
    }
  }
  return null;
}

/**
 * Group lines by normalised payee so one decision covers many lines
 * (PLAN §6.4: "23 transactions from 'Z Energy' → Vehicle running costs").
 */
export function groupByPayee<T extends { payee: string; particulars: string }>(
  lines: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const l of lines) {
    const key = (l.payee || l.particulars || "(no description)")
      .toUpperCase()
      .replace(/\d{2,}/g, "") // strip invoice/reference numbers
      .replace(/\s+/g, " ")
      .trim();
    const arr = groups.get(key) ?? [];
    arr.push(l);
    groups.set(key, arr);
  }
  return groups;
}
