// Sector starter packs: pre-populated Layer-2 categories so no organisation
// ever faces an empty (or 40-row) chart of accounts (docs/PLAN.md §5).
// Packs differ only in Layer 2; Layer 1 is identical for everyone in a tier.
// Each entry carries the Tier 3 compliance code; the Tier 4 equivalent is
// derived via equivalentCode() when seeding a Tier 4 organisation.

import { isValidComplianceCode, type Tier } from "./categories";

// Correspondence between Tier 3 and Tier 4 compliance codes, used when an
// organisation's detected tier differs from the pack default or changes
// after categorisation. Tier 4 merges some Tier 3 distinctions (grants into
// donations, volunteer costs into employee costs); mapping back T4→T3 uses
// the broadest code and lets the grant follow-up questions refine it.
const T3_TO_T4: Record<string, string> = {
  T3_REV_DONATIONS: "T4_IN_DONATIONS",
  T3_REV_GRANTS_GENERAL: "T4_IN_DONATIONS",
  T3_REV_GRANTS_CAPITAL: "T4_IN_DONATIONS",
  T3_REV_GOODS_SERVICES: "T4_IN_GOODS_SERVICES",
  T3_REV_MEMBERS: "T4_IN_MEMBERS",
  T3_REV_INVESTMENT: "T4_IN_INVESTMENT",
  T3_REV_OTHER: "T4_IN_OTHER",
  T3_EXP_EMPLOYEE: "T4_OUT_EMPLOYEE",
  T3_EXP_VOLUNTEER: "T4_OUT_EMPLOYEE",
  T3_EXP_GOODS_SERVICES: "T4_OUT_GOODS_SERVICES",
  T3_EXP_GRANTS_MADE: "T4_OUT_GRANTS_MADE",
  T3_EXP_OTHER: "T4_OUT_OTHER",
};

const T4_TO_T3: Record<string, string> = {
  T4_IN_DONATIONS: "T3_REV_DONATIONS",
  T4_IN_GOODS_SERVICES: "T3_REV_GOODS_SERVICES",
  T4_IN_MEMBERS: "T3_REV_MEMBERS",
  T4_IN_INVESTMENT: "T3_REV_INVESTMENT",
  T4_IN_OTHER: "T3_REV_OTHER",
  T4_OUT_EMPLOYEE: "T3_EXP_EMPLOYEE",
  T4_OUT_GOODS_SERVICES: "T3_EXP_GOODS_SERVICES",
  T4_OUT_GRANTS_MADE: "T3_EXP_GRANTS_MADE",
  T4_OUT_OTHER: "T3_EXP_OTHER",
};

export function equivalentCode(code: string, targetTier: Tier): string {
  if (isValidComplianceCode(code, targetTier)) return code;
  const mapped = targetTier === "TIER_4" ? T3_TO_T4[code] : T4_TO_T3[code];
  if (!mapped) throw new Error(`No ${targetTier} equivalent for ${code}`);
  return mapped;
}

export interface StarterCategory {
  name: string;
  /** Tier 3 compliance code; converted with equivalentCode() for Tier 4 orgs. */
  complianceCode: string;
  /** Seed a PROGRAMME dimension of the same name alongside the category. */
  isProgramme?: boolean;
}

export interface StarterPack {
  key: string;
  label: string;
  categories: StarterCategory[];
}

// Categories every organisation gets regardless of pack.
export const COMMON_CATEGORIES: StarterCategory[] = [
  { name: "Donations and koha", complianceCode: "T3_REV_DONATIONS" },
  { name: "Fundraising events", complianceCode: "T3_REV_DONATIONS" },
  { name: "Grants — general", complianceCode: "T3_REV_GRANTS_GENERAL" },
  { name: "Interest received", complianceCode: "T3_REV_INVESTMENT" },
  { name: "Wages and salaries", complianceCode: "T3_EXP_EMPLOYEE" },
  { name: "Volunteer expenses and recognition", complianceCode: "T3_EXP_VOLUNTEER" },
  { name: "Rent and venue hire", complianceCode: "T3_EXP_GOODS_SERVICES" },
  { name: "Insurance", complianceCode: "T3_EXP_GOODS_SERVICES" },
  { name: "Power, phone and internet", complianceCode: "T3_EXP_GOODS_SERVICES" },
  { name: "Office and administration", complianceCode: "T3_EXP_OTHER" },
  { name: "Bank fees", complianceCode: "T3_EXP_OTHER" },
  { name: "Accounting and audit", complianceCode: "T3_EXP_OTHER" },
];

export const STARTER_PACKS: StarterPack[] = [
  {
    key: "community_services",
    label: "Community and social services",
    categories: [
      { name: "Programme delivery", complianceCode: "T3_EXP_GOODS_SERVICES", isProgramme: true },
      { name: "Client support costs", complianceCode: "T3_EXP_GOODS_SERVICES" },
      { name: "Service fees received", complianceCode: "T3_REV_GOODS_SERVICES" },
      { name: "Contract income", complianceCode: "T3_REV_GOODS_SERVICES" },
    ],
  },
  {
    key: "sports_club",
    label: "Sports and recreation club",
    categories: [
      { name: "Membership subscriptions", complianceCode: "T3_REV_MEMBERS" },
      { name: "Game and tournament fees", complianceCode: "T3_REV_GOODS_SERVICES" },
      { name: "Bar and canteen sales", complianceCode: "T3_REV_GOODS_SERVICES" },
      { name: "Uniforms and equipment", complianceCode: "T3_EXP_GOODS_SERVICES" },
      { name: "Grounds and facility costs", complianceCode: "T3_EXP_GOODS_SERVICES" },
      { name: "Affiliation fees", complianceCode: "T3_EXP_OTHER" },
    ],
  },
  {
    key: "arts_culture",
    label: "Arts and culture",
    categories: [
      { name: "Ticket and box office sales", complianceCode: "T3_REV_GOODS_SERVICES" },
      { name: "Workshop fees", complianceCode: "T3_REV_GOODS_SERVICES" },
      { name: "Production costs", complianceCode: "T3_EXP_GOODS_SERVICES", isProgramme: true },
      { name: "Artist and performer fees", complianceCode: "T3_EXP_GOODS_SERVICES" },
    ],
  },
  {
    key: "marae_cultural",
    label: "Marae and cultural organisations",
    categories: [
      { name: "Marae bookings and hireage", complianceCode: "T3_REV_GOODS_SERVICES" },
      { name: "Whānau and hapū contributions", complianceCode: "T3_REV_DONATIONS" },
      { name: "Wānanga and events", complianceCode: "T3_EXP_GOODS_SERVICES", isProgramme: true },
      { name: "Marae maintenance", complianceCode: "T3_EXP_GOODS_SERVICES" },
      { name: "Kai and manaakitanga", complianceCode: "T3_EXP_GOODS_SERVICES" },
    ],
  },
  {
    key: "environment",
    label: "Environmental and conservation",
    categories: [
      { name: "Restoration projects", complianceCode: "T3_EXP_GOODS_SERVICES", isProgramme: true },
      { name: "Plants, traps and materials", complianceCode: "T3_EXP_GOODS_SERVICES" },
      { name: "Contract and consultancy income", complianceCode: "T3_REV_GOODS_SERVICES" },
    ],
  },
  {
    key: "faith_based",
    label: "Faith-based organisations",
    categories: [
      { name: "Offerings and tithes", complianceCode: "T3_REV_DONATIONS" },
      { name: "Ministry programmes", complianceCode: "T3_EXP_GOODS_SERVICES", isProgramme: true },
      { name: "Building and property costs", complianceCode: "T3_EXP_GOODS_SERVICES" },
      { name: "Outreach and community support", complianceCode: "T3_EXP_GRANTS_MADE" },
    ],
  },
  {
    key: "generic",
    label: "Something else / not sure",
    categories: [
      { name: "Income from activities", complianceCode: "T3_REV_GOODS_SERVICES" },
      { name: "Activity and event costs", complianceCode: "T3_EXP_GOODS_SERVICES" },
    ],
  },
];

/** Categories to seed for an organisation: common + pack, codes per tier. */
export function seedCategories(packKey: string, tier: Tier): StarterCategory[] {
  const pack = STARTER_PACKS.find((p) => p.key === packKey) ?? STARTER_PACKS[STARTER_PACKS.length - 1];
  const all = [...COMMON_CATEGORIES, ...pack.categories];
  return all.map((c) => ({ ...c, complianceCode: equivalentCode(c.complianceCode, tier) }));
}
