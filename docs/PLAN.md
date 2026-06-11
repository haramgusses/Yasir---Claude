# NZ Nonprofit Financial Statement Tool — Product & Technical Plan

> Status: v0.2 — design plan with regulatory grounding verified against public sources
> (XRB, Charities Services, Companies Office, professional bodies) as at June 2026.
> Residual items to confirm against the standards' full text are listed in §2.9 —
> note that xrb.govt.nz and charities.govt.nz block automated fetching, so the team
> should download the standard PDFs and official templates manually before build.

A tool that takes a raw bank statement (CSV / Excel / PDF) and guides a non-accountant
through producing compliant Tier 3 / Tier 4 performance reports for New Zealand
community organisations registered under the Incorporated Societies Act 2022 and/or the
Charities Act 2005.

---

## 1. The one architectural insight everything hangs off

**For a Tier 4 entity (cash basis), the bank statement effectively *is* the books.**
The Tier 4 (NFP) Standard's core financial statement — the **Statement of Cash Received
and Cash Paid** — is a categorised, totalled bank statement; significant assets and
liabilities go in the notes. Tier 4 output is therefore almost fully derivable from the
upload.

**Tier 3 (accrual basis) is the cash story plus adjustments the bank statement cannot
show**: money owed to/by the organisation at year end, grants with documented
expectations not yet satisfied, depreciation, donated assets, prepayments. And because
Tier 3 *also* requires a Statement of Cash Flows (simplified, with categories aligned to
the performance statement), a bank-statement-native tool generates that statement
directly from source data — something accrual-first bookkeeping tools derive backwards.

So the product is built **cash-first, accrual-by-interview**:

1. Derive a complete, verified cash picture from the bank statement(s).
2. Run a guided **year-end interview** — plain-language questions ("Did anyone still owe
   you money at 31 March?", "Had you received grant money you hadn't yet spent on what
   it was given for?") — whose answers generate the accrual adjustments as structured
   journal entries the user never has to see as journals.

This means one engine serves both tiers, the volunteer treasurer answers questions
instead of posting journals, and the finance manager can open the "workings" view and
see (and, in advanced mode, post) the underlying entries.

---

## 2. Regulatory grounding (verified June 2026)

### 2.1 The reporting framework

- The XRB issued the **Tier 3 (NFP) Standard** and **Tier 4 (NFP) Standard** in May
  2023, **mandatory for accounting periods beginning on or after 1 April 2024**. The old
  PBE SFR-A (accrual) and PBE SFR-C (cash) are superseded. Any year-end the tool will
  ever prepare (FY2025/26 onward) falls under the new standards — **build for the new
  standards only**; filed historical examples on the register may follow the old format
  and must not be treated as layout gospel.
- **Tier 4 eligibility:** total operating payments **< $140,000** (the statutory
  "specified not-for-profit entity" line — measured against **each of the two preceding
  accounting periods**).
- **Tier 3 eligibility:** total expenses **≤ $5 million** (raised from $2m) and no
  public accountability (holding money as agent/trustee for others in specified ways —
  rare for community groups; one screening question suffices).
- Entities may always **opt up** a tier (Tier 4-eligible may report Tier 3); never down.

### 2.2 Required components per tier (the product's output contract)

**Tier 3 performance report:**
1. Entity Information
2. Statement of Service Performance
3. Statement of Financial Performance (accrual)
4. Statement of Financial Position
5. Statement of Cash Flows — *retained* in the new standard, simplified, categories
   aligned with the Statement of Financial Performance
6. Statement of Accounting Policies + Notes

**Tier 4 performance report:**
1. Entity Information
2. Statement of Service Performance
3. **Statement of Cash Received and Cash Paid** (renamed from "Statement of Receipts
   and Payments")
4. Notes — including **significant assets and significant liabilities** (this replaced
   the old separate Statement of Resources and Commitments)

The brief's statement list omitted the **Statement of Service Performance** and the
Tier 4 specifics — both are mandatory parts of the filed performance report. A tool that
produces only financial statements produces a **non-filable document**. See §6.6.

### 2.3 Minimum categories (Layer 1 of the category model)

Both standards prescribe **minimum categories** for the face of the statements, and
explicitly permit **renaming and further breakdown provided categories are not mixed**
(e.g. "Receipts from providing goods or services" may become "Class fees and book
sales", but donations may never be merged with interest). Under the new Tier 3 standard,
**further disaggregation is no longer allowed on the face** of the Statement of
Financial Performance — extra detail goes **in the notes**. This directly validates the
two-layer category model in §5: fixed compliance categories on the face, user categories
surfacing as note breakdowns.

Verified Tier 3 minimum revenue categories include: donations/koha/bequests and
fundraising revenue; **grants received for general funding**; **grants/donations
received with an expectation they be used to purchase or construct a significant asset**
(capital grants are their own category — the categorisation flow must detect them);
revenue from providing goods or services; fees/subscriptions from members; interest and
investment revenue. On the expense side, the old combined "volunteer and employee
related" category is now **split into employee costs and volunteer-related costs**.
The build must transcribe the exact, complete category lists from the standards' text.

### 2.4 Grants with conditions

The new Tier 3 standard replaced "use or return" conditions with **"documented
expectations over use"**: where a significant grant/donation/bequest has expectations
agreed in writing (or otherwise evidenced), communicated at transfer, and specific
enough to demonstrate satisfaction, revenue is recognised **as those expectations are
satisfied** — unspent amounts sit as a liability. This is the single most error-prone
judgement for small charities and is a primary target of the year-end interview (§7).

### 2.5 GST presentation

GST-registered → prepare **GST-exclusive**; not registered → **GST-inclusive**; mixed
registration → mixed basis, applied consistently. (Confirm the exact new-standard
paragraph during build; older guidance allowed a consistency-based choice.)

### 2.6 Charities Act 2005 (as amended 2023) — filing and assurance

- Registered charities file an **annual return + performance report within 6 months of
  balance date**; filed reports are publicly downloadable from the charities register.
- **Assurance thresholds** (Financial Reporting (Inflation Adjustments) Regulations
  2021; current as of 2026): total operating expenditure **≥ $1.1m in each of the two
  preceding financial years → audit**; **≥ $550k → review or audit**, by a qualified
  auditor.
- 2023 amendments: charities must **review governance procedures by 5 October 2026**
  and three-yearly thereafter (a nice contextual nudge for the tool, not a feature);
  DIA gained power to exempt **"very small" charities** (to be defined by regulations)
  from full reporting — **check whether regulations exist yet** (§2.9).
- Charities Services offers a **Combined Tier 4 Annual Return** — performance-report
  information entered directly within the online annual return. Product implication:
  for the smallest charities the tool's Tier 4 export should include a "figures for
  your annual return" summary mapped to that form, since some users will type numbers
  into the portal rather than attach a document.

### 2.7 Incorporated Societies Act 2022 — filing and the small-society carve-out

- The reregistration deadline (**5 April 2026**) has passed: societies that did not
  reregister **ceased to exist** and were removed from the register (restoration is
  possible). **Onboarding must look up the org's registration status** and warn — a
  tool preparing statements for a legally non-existent entity helps nobody.
- Societies (unless "small") must prepare financial statements per **XRB standards**
  and file with the Registrar **within 6 months of balance date**, plus an annual
  return.
- **Small society exemption:** total operating payments **< $50,000** in each of the
  two preceding periods AND total current assets **< $50,000** at each of the two
  preceding balance dates AND **not a donee organisation** (ITA 2007 s LD 3(2)). Small
  societies may follow minimum requirements set by regulations instead of XRB
  standards. The donee-organisation limb matters: a tiny society with IRD donee status
  does *not* qualify. The tool should still offer such societies the Tier 4 format —
  it satisfies the minimum requirements and is what funders expect.
- **Dual-registered** (society + charity): reporting under the Charities Act regime
  satisfies the society's obligation — detect via registry lookup and route to the
  charity pathway.
- No general statutory audit for non-charitable societies below the Charities-Act-style
  thresholds, but constitutions often require one — interview asks, output includes the
  placeholder accordingly (confirm statutory edge cases, §2.9).

### 2.8 Other verified points

- **First-year comparatives:** first-time preparers under the standard generally need
  no comparative figures in year one. Existing orgs: comparatives required — entered
  manually (§7).
- **Donated assets (Tier 3):** a significant donated asset is recognised as revenue and
  an asset **unless its value is not readily obtainable** (then disclosure). Volunteer
  time: recognition not required; disclosure-based treatment (confirm exact wording).
- Tier 4's renamed statement and notes-based assets/liabilities list mean the old
  Statement of Resources and Commitments must **not** be generated for new-standard
  periods.

### 2.9 To confirm against primary text before build (the validation checklist)

1. Exact, complete minimum category lists and wording, both tiers (download the two
   standard PDFs from xrb.govt.nz — blocked to bots, manual download needed).
2. Exact GST presentation paragraph (new standards).
3. Exact first-time-adoption/comparatives provisions, incl. transition from
   spreadsheet-kept records and opening-balance establishment for Tier 3 fixed assets.
4. SSP minimum content per tier under the new standards (the outcomes/outputs terms
   were replaced with Tier-2-aligned terminology) — and whether non-charity
   incorporated societies must include an SSP (charity filings must).
5. Status of "very small charity" exemption regulations (Charities Amendment Act 2023).
6. Statutory audit edge cases for societies; "public accountability" precise definition
   for the screening question.
7. Charities Services' current official templates (Word/Excel) for the NEW standards —
   mirror their structure so filed output looks instantly familiar to Charities
   Services reviewers; also their published "common errors" guidance to drive the
   validation rules in §6.7.
8. Big-5 bank CSV/Excel export column layouts — verify empirically with real sample
   exports during build (documented formats: see Xero/MYOB import guides per bank).
9. Charities Register open-data API and IS register search: terms of use for the
   onboarding lookup and prior-report pre-fill (§7).

Key sources: xrb.govt.nz (standards, FAQs, "What's changed in the new Tier 3 Standard");
charities.govt.nz (minimum categories, audit/review requirements, Tier 4 guidance);
is-register.companiesoffice.govt.nz (filing, small/large society pages); CA ANZ and
BDO/Baker Tilly/Audit Assistant summaries; legislation.govt.nz (Charities Act 2005 ss
42A–42F, ISA 2022).

---

## 3. Personas and the adaptive-UX strategy

Two personas, one interface:

- **Tema** — volunteer treasurer, first year, comfortable with spreadsheets, doesn't know
  what "accrual" means, terrified of getting it wrong. Optimise for *confidence and
  guardrails*.
- **Priya** — finance manager, part-qualified or CA, knows exactly what she wants,
  will be infuriated by forced hand-holding. Optimise for *speed and control*.

### Design rules (apply everywhere)

1. **Never ask the user to self-identify skill level.** Adapt by behaviour and by
   progressive disclosure, not by a "beginner/expert" toggle.
2. **Plain language first, accounting term attached.** Every label is written for Tema
   with Priya's term alongside: "Money owed to you at year end *(Accounts receivable)*".
   Priya scans for the term in parentheses; Tema reads the sentence. One interface.
3. **Defaults that are safe to accept.** Every screen must be completable by accepting
   defaults without creating a compliance problem. Customisation is always additive.
4. **Escape hatches, not separate modes.** Advanced capability lives behind consistent
   affordances ("Show workings", "Edit as table", keyboard shortcuts, bulk actions)
   that Priya discovers in minutes and Tema never needs.
5. **The system states conclusions, asks for facts.** Tier selection, GST treatment,
   statement structure are *outcomes the tool announces with reasons* ("Based on total
   spending of $98,400, your report uses the simple cash format — Tier 4"), never
   questions the user must answer correctly.
6. **Confidence-driven attention.** Work is presented as a shrinking queue ("12
   transactions need your attention"), not as an open-ended ledger to wander.

### Where professional UX patterns pay off most (ranked)

1. **The categorisation review queue** — bulk accept high-confidence suggestions,
   keyboard-first triage for the rest. This is 80% of time-in-app.
2. **Inline integrity feedback** — the "Does it balance?" strip permanently visible:
   opening balance + money in − money out = closing balance, going green per account.
   Converts an abstract audit concept into a progress mechanic.
3. **The year-end interview** — wizard with one question per screen, examples, "not
   sure?" expanders, and skip-with-consequence messaging.
4. **Empty states that teach** — first upload screen shows exactly where in ANZ/ASB/
   BNZ/Westpac/Kiwibank internet banking the CSV export lives, with screenshots.
5. **Pre-export readiness checklist** — blockers vs warnings, each linking to the fix.
6. **Error recovery over error prevention** — everything undoable; "uncategorise",
   re-upload replaces cleanly, periods unlock with an audit note.

---

## 4. The workflow, refined: 4 stages become 6

The brief's four stages are right but compress three distinct activities into stage 2,
and omit two essential bookends. Proposed flow:

```
0. Lightweight setup      → who you are (name → registry lookup, balance date) — 2 minutes
1. Upload & verify        → parse statements, dedupe, verify balances tie
2. Categorise             → group + label transactions (the big middle)
3. Year-end interview     → accrual items, restricted funds, comparatives, SSP facts
4. Review & generate      → readiness checks, draft statements, fix loop
5. Export & next steps    → PDF/DOCX + "what to do now" (sign-off, file with regulator)
```

Key refinements vs the brief:

- **Verification is its own step (1), before categorisation.** If the transaction set
  doesn't tie to the bank's own opening/closing balances, everything downstream is
  fiction. Don't let users categorise unverified data.
- **"Reconcile & Categorise" splits.** Reconciliation (does the data tie out?) is a
  systems problem the tool does; categorisation (what was this for?) is a knowledge
  problem only the user can do. Mixing them confuses both.
- **The year-end interview is explicit (3).** This is where Tier 3 accrual data,
  restricted-fund decisions, comparatives, and SSP inputs are gathered. For a Tier 4 org
  it shrinks to ~5 questions (significant assets/liabilities for the notes, SSP, other
  bank accounts, constitution audit clause).
- **Stage 5 exists because generating the document is not compliance.** The treasurer
  still must get committee approval and signatures, and file with Charities Services
  (annual return + performance report, 6 months) or the IS Registrar (statements +
  annual return, 6 months). The tool must say so explicitly or it creates false
  confidence.

---

## 5. The category model (the heart of the hybrid design)

### Two layers, one invariant

- **Layer 1 — Compliance categories (fixed).** The minimum categories prescribed by the
  Tier 3 / Tier 4 standard (§2.3). Users can *not* delete, merge, or remap these. They
  are the rows of the generated statements. (Renaming on the face is permitted by the
  standards within strict limits; v0.1 keeps Layer 1 names fixed for safety and lets
  Layer 2 carry the user's language.)
- **Layer 2 — Organisation categories (fully flexible).** "Youth mentoring programme",
  "Op-shop", "Lotteries grant — van purchase". Users add/rename/merge/restructure
  freely. Each Layer-2 category carries two attributes set once at creation:
  - **maps-to**: exactly one Layer-1 compliance category (suggested automatically,
    changeable from a constrained list);
  - **dimensions** (optional): programme tag, funder tag, fund-restriction tag.

**The invariant: every transaction dollar belongs to exactly one Layer-2 category, and
every Layer-2 category maps to exactly one Layer-1 category.** Statements aggregate
Layer 2 → Layer 1 on the face; the notes carry the Layer-2 and dimension breakdowns
(grants by funder, expenditure by programme) — exactly matching the new Tier 3 rule
that extra disaggregation lives in the notes, not on the face. Users can therefore
customise enthusiastically and *cannot* break compliance — the worst outcome of a bad
mapping is a miscategorised row, which validation rules catch (e.g. "Interest received"
mapped to an expense class). The standards' own "rename but never mix categories" rule
is enforced structurally rather than by user discipline.

### The default template

Ship sector starter packs (community services, sports club, arts, marae/cultural,
environmental, faith-based) that pre-populate Layer 2 with likely categories and
programme dimensions. Selection happens in setup via one question: "What does your
organisation mostly do?" Starter packs are a UX device only — they differ in Layer 2;
Layer 1 is identical for everyone in a tier.

### Forcing granularity without overwhelm

Granularity (per-funder grants, per-programme expenditure) is extracted **at the moment
of categorisation, only when triggered**:

- A credit ≥ a threshold (e.g. $500, tunable) categorised as a grant/donation triggers
  one extra inline question: "Who was this from?" with funder autocomplete (seeded with
  the major NZ funders: Lottery Grants Board, COGS, community foundations — Foundation
  North, Rātā, TECT etc., gaming trusts, councils). One question, asked at the only
  moment the user has the context to answer it.
- Grant credits also get the two compliance triggers: "Was this given to buy or build
  something big (van, building, equipment)?" (→ the capital-grant minimum category,
  §2.3) and "Did the funder set conditions in writing about how/when it must be used?"
  (→ documented-expectations treatment, §2.4).
- Programme tagging is offered, not forced, at categorisation time — with a bulk "tag
  all selected" action. If the org never tags programmes, statements remain compliant
  (programme note simply isn't produced); if a funder requires it, the funder-report
  export surfaces "untagged spending" as the gap to close.
- **Never present a 40-row chart of accounts to configure upfront.** Categories surface
  through use; the full list lives in Settings for Priya.

---

## 6. Engine design

### 6.1 Parsing & import

- **v0.1 formats:** CSV and Excel from the five main banks (ANZ, ASB, BNZ, Westpac,
  Kiwibank) + a generic column-mapping fallback for anything else (user maps Date /
  Description / Amount-or-Debit/Credit columns once; mapping remembered). Build the
  per-bank profiles from real sample exports (§2.9.8).
- **PDF:** digital-text PDFs parsed with mandatory balance verification before
  acceptance; scanned/image PDFs out of scope for v0.1 (the silent-OCR-error risk is the
  single worst failure mode for a numbers product). The empty state teaches users to
  export CSV instead — every NZ bank offers it.
- Imported lines are **immutable source records** (hash of normalised date+amount+
  reference+account for dedupe across overlapping uploads). Re-uploads reconcile against
  existing lines rather than appending.
- **Date-coverage check:** uploaded statements must tile the financial year per account
  with no gaps; gaps are a *blocker*, surfaced visually as a timeline.

### 6.2 Verification (the integrity invariant)

Per account: `opening balance + Σ transactions = closing balance`. Opening/closing come
from the parsed statement where available, else the user types them from the paper
statement (two fields, with a photo of where to find them). Until every account ties,
the workflow shows a calm but firm blocker. Multiple accounts: inter-account transfers
auto-matched (same amount, opposite sign, ≤2-day window) and eliminated from
revenue/expense — shown as "Transfers between your accounts" so the user sees they
weren't lost.

### 6.3 Ledger (one engine for both tiers)

Double-entry under the hood, invisible above it. Every bank line auto-posts its bank-side
leg; categorisation supplies the other leg. Interview answers generate adjustment
journals (append-only, reversible, each carrying a plain-language provenance note:
"From your answer: 'The hall hire invoice for March ($450) was paid in April'"). Tier 4
simply never has adjustment journals and reports on the cash legs. Benefits: Tier 3 is a
superset not a fork; an accountant can audit the workings; "show workings" view is free;
and the Tier 3 Statement of Cash Flows falls out of the cash legs natively.

### 6.4 Suggestion engine (categorisation assistance)

Three layers, in order of trust:

1. **Deterministic NZ rules** — IRD payments (PAYE/GST patterns), bank fees by bank,
   interest lines, common payees (insurers, councils, power/telco), payroll providers
   (Smartly, PaySauce, iPayroll), EFTPOS/Stripe/Givealittle settlement patterns. High
   confidence, still confirmable.
2. **Org memory** — same payee, same category as last time; learned per organisation,
   suggested across years.
3. **LLM classification** for the remainder — batched, returns category + confidence +
   one-line rationale. **LLM output is always a suggestion, never auto-committed**, and
   numbers are never LLM-touched — only labels.

UX: suggestions arrive pre-grouped by payee ("23 transactions from 'Z Energy' →
Vehicle running costs") so one decision covers many lines. Confidence ≥ threshold goes
to a "review in bulk" list; below it, the triage queue.

### 6.5 Statement generation

A **pure function**: `(ledger, entity profile, tier, answers) → statement model (JSON)`
→ deterministic renderers (HTML preview, PDF via headless Chromium print CSS, DOCX via
`docx` library). No generative step anywhere near the numbers. Layout mirrors the
current official Charities Services templates for the new standards so reviewers see a
familiar document. Face-of-statement rows are Layer 1 only; Layer 2 and dimensions
render as notes (§5). Accounting policies are templated text with computed insertions
(entity name, GST status, depreciation methods actually used); the only free text is
user-authored (SSP descriptions, optional notes), clearly editable in preview. On
export, the period snapshot is frozen (model JSON + rendered files stored); reopening a
finalised period requires an explicit unlock that's logged. Tier 4 export additionally
produces the "figures for your annual return" summary aligned to the Combined Tier 4
Annual Return (§2.6).

### 6.6 Statement of Service Performance builder

Mandatory part of the performance report for both tiers — built into the core flow, not
an add-on. Three-screen mini-flow: (1) "What did you set out to do this year?" (2–5
outcome statements, with sector examples), (2) "What did you actually do?" (countable
outputs: sessions run, people helped — number + description), (3) preview. Stored per
year so next year pre-fills. Use the new standards' terminology, not the old
outcomes/outputs wording (§2.9.4).

### 6.7 Validation engine

Rules with severity (`blocker` / `warning` / `note`), each with a plain-language message
and a deep link to the fix. Examples: bank balances don't tie (blocker); uncategorised
transactions remain (blocker); SSP empty (blocker for charity filings); grant income
above threshold with no funder tag (warning); large grant late in year with low matching
spend and no documented-expectations answer (warning); negative expense category
(warning); "Donations" containing round-number weekly credits that look like invoice
payments (note); tier threshold within 10% (warning + explanation of what changes if
crossed); assurance thresholds crossed — review ≥ $550k, audit ≥ $1.1m (note with
explanation, since it's based on the two preceding years). Seed the rule list from
Charities Services' published common-errors guidance (§2.9.7). The pre-export checklist
is just this rule output, grouped.

---

## 7. The hard cases (from the brief's tensions & scenarios)

### Tier detection — what we actually need to ask

Upfront (setup, ~2 min): organisation name (→ lookup against the Charities Register and
Incorporated Societies register to pre-fill registration status, charity number, balance
date — and to catch societies that failed to reregister by 5 April 2026, §2.7), balance
date, GST registered (y/n/not sure → guidance link), and **one plain-language
public-accountability screening question**. Everything else — total expenses/payments —
is computed from the data. Because both the $140k tier line and the assurance thresholds
are measured against the **two preceding periods**, setup asks one rough question
("roughly, what did the organisation spend in each of the last two years — under or
over $140k?") rather than demanding prior statements. Tier is *provisional* at setup,
*confirmed* after categorisation, *re-checked* at export. Near-threshold orgs get the
warning + a "what changes" explainer. Dual-registered orgs are routed to the charity
pathway automatically (§2.7).

### Restricted funds

Restriction is a **dimension tag, not a category**: when grant income is tagged with a
funder, one follow-up — "Can this money only be used for a specific purpose?" If yes, a
named fund is created; expenditure can be tagged against it (bulk, optional, with a
running "remaining" meter). Statements then show accumulated funds split into
restricted/unrestricted and the funds note writes itself. Grants with **documented
expectations** (§2.4) are distinct from merely-earmarked money: the interview detects
candidates (large grants late in year with low matching spend), asks "did the funder put
conditions in writing?", and books the unsatisfied portion as a liability rather than
revenue. This distinction — restricted *equity* vs deferred *liability* — is exactly
where small charities go wrong, and the tool encodes it as two different plain-language
questions so the user never faces the technical distinction directly.

### Comparatives with no prior digital records

First-year orgs: no comparatives, statement notes "first financial year" (§2.8).
Existing orgs: a **comparatives entry screen that mirrors the generated statement layout
exactly** — user copies last year's totals from their filed PDF (fetchable from the
public charities register; pre-fill from their last filed performance report if the
register API permits, §2.9.9). Only Layer-1 totals are needed, ~15 numbers, with a
tie-check (last year's closing balances = this year's opening). Prior-year figures filed
under the old PBE SFR-A/C may need re-mapping to the new category names — the entry
screen handles this with a "their old name → new name" hint column. Explicitly *not*
attempting transaction-level prior-year rebuild.

### Mid-year switch from spreadsheets

Same mechanism as comparatives: bank statements still cover the whole year (banks
provide 12+ months of history), so the transaction record is complete even if their
spreadsheet only covers part of it. The spreadsheet is used as a categorisation
cross-check, not a data source. This collapses "mid-year switch" into the normal flow.

### GST

GST-registered orgs: amounts presented GST-exclusive (§2.5); the bank lines are gross,
so the tool needs each category's GST treatment (defaulted per category: most
standard-rated, donations/grants typically not, bank fees exempt…) and computes the GST
portion + reconciles against actual IRD GST payments/refunds visible in the bank data
(a built-in cross-check). Non-registered: GST-inclusive, zero extra work. v0.1 supports
both but does **not** prepare GST returns — boundary stated clearly.

### Payroll

PAYE payments to IRD and net wage payments are both visible in bank data; gross wages =
net + PAYE, so the tool can reconstruct and present employee costs correctly (now a
separate minimum category from volunteer costs, §2.3) with one interview confirmation.
Contractor payments (with/without withholding tax) asked about when payee patterns
suggest it. No payroll processing — boundary stated.

### Fixed assets & depreciation (Tier 3)

Interview-driven mini asset register: large payments auto-flagged as asset candidates
("This $8,200 payment to Noel Leeming — equipment that will last years, or supplies?").
Straight-line only in v0.1, IRD-style default rates by asset class, opening balances
for pre-existing assets entered from last year's statement (or estimated with a
disclosed policy note for first-time preparers, per the standard's transition
provisions — §2.9.3). Capital grants funding these assets are caught at categorisation
(§5) so the grant category and the asset stay consistent.

### In-kind donations & volunteer time

Interview questions with materiality guidance. Significant donated assets: recognised
as revenue + asset unless value not readily obtainable (§2.8). Volunteer time:
disclosure-based, recognition not required. Default to the simplest compliant
treatment; let Priya opt into recognition where permitted.

### Duplicates, reversals, fees

Dedupe at import (hash + fuzzy window). Reversal pairs (same amount opposite sign, same
payee, ≤ a few days) auto-matched and netted with a visible "reversed transactions"
group. Dishonour/bank fees auto-categorised by deterministic rules. Genuinely ambiguous
lines get a "Park for later" state — parked lines block export, preventing the silent
"Miscellaneous" dumping ground that reviewers (and Charities Services' common-errors
reports) flag.

---

## 8. v0.1 scope

### In

- Single organisation per account; CSV/Excel import for big-5 banks + generic mapper;
  digital-PDF behind balance verification
- Multiple bank accounts incl. transfer elimination; full verification layer
- Two-layer category model, sector starter packs, funder/programme/restriction dimensions
- Suggestion engine (rules + org memory + LLM-assist with confirm-only UX)
- Tier detection (both tiers) incl. registry lookups; Tier 4 complete; Tier 3 with:
  AR/AP via interview, documented-expectations grants, capital grants, basic fixed
  assets + straight-line depreciation, restricted funds, GST-exclusive presentation
- Year-end interview; SSP builder; comparatives manual entry (mirror-layout screen with
  old-standard re-mapping hints)
- All required statements + notes per tier (new standards only), validation checklist,
  PDF + DOCX export, Combined Tier 4 Annual Return figures summary
- Branding: logo + accent colour only
- "What happens next" filing guidance (not filing itself)

### Out (deliberately)

- Scanned-image PDF OCR; bank feeds (Akahu/open banking — evaluate for v2)
- GST return preparation, payroll processing, invoicing/bookkeeping (this is a year-end
  tool, not Xero)
- Tier 1/2, consolidation/branches, inventory, revaluations, foreign currency
- Style-replication from prior statements (v2; high effort, zero compliance value)
- Multi-user collaboration / committee e-sign-off (v1.x; export PDF for approval instead)
- Filing API integration (none exists for Charities Services or the IS register)
- Audit/review execution (placeholder page + "you need a reviewer if…" rule only)

## 9. Riskiest failure modes (ranked by harm × likelihood)

1. **Silent data corruption at parse time** (PDF/CSV mis-parse) → mitigated by the
   balance-tie invariant being a hard gate. *This is why verification is stage 1.*
2. **Producing financials without the SSP** → non-filable report, user finds out from
   the regulator. Mitigated by SSP being in the core flow, not an add-on.
3. **Building to the old standards** (PBE SFR-A/C layouts still dominate filed examples
   and older guidance) → outputs wrong for every period the tool will ever prepare.
   Mitigated by §2's output contract and template verification (§2.9).
4. **Wrong tier near thresholds** → entire wrong format. Mitigated by computed
   detection, the two-preceding-years question, re-check at export, warnings.
5. **Conditional grants recognised as income** (documented expectations missed) →
   overstated surplus, the classic small-charity error. Mitigated by targeted interview
   detection.
6. **Coverage gaps / second bank account not uploaded** → understated activity. Mitigated
   by timeline view + an interview question ("any other accounts, term deposits, PayPal/
   Stripe balances?").
7. **GST-registered org reporting GST-inclusive** → all figures ~15% wrong. Mitigated by
   the IRD-payment cross-check.
8. **False confidence at export** ("the tool said it's compliant") → mitigated by honest
   framing: the export cover sheet states what was verified, what was user-asserted, and
   what still needs human review/approval/filing.
9. **LLM mis-categorisation accepted in bulk** → mitigated by confidence gating, payee
   grouping (errors are visible in aggregate), and validation heuristics.

## 10. Architecture on the existing stack

Keep: Next.js 14 App Router, Prisma/Postgres (Supabase), Clerk, UploadThing, shadcn/ui,
zod, react-hook-form. Add: a parsing service (server-side, Node; `xlsx`/`papaparse`;
`pdfjs` for text-layer PDFs), LLM categorisation via Claude API (batch; suggestions
only), `docx` for Word export, headless Chromium (or `@react-pdf`) for PDF. Replace the
shipping-domain Prisma schema wholesale with: `Organisation`, `FinancialYear`,
`BankAccount`, `ImportBatch`, `SourceTransaction` (immutable), `TransactionGroup`/`Split`,
`Category` (layered), `Dimension` (funder/programme/fund), `JournalEntry` (append-only),
`InterviewAnswer`, `StatementSnapshot`, `ValidationResult`. Sensitive data note: bank
transactions are personal information under the Privacy Act 2020 — NZ/AU data residency
and a clear retention policy should be decided before launch.

## 11. Open questions for the product owner

1. **Wedge and pricing**: free for Tier 4 / paid Tier 3? Who pays — the org, or funders/
   umbrella bodies sponsoring it for their grantees?
2. **Year-end tool vs year-round tool**: is the long-term ambition periodic upload
   (quarterly?) with year-end assembly, or strictly annual? Affects bank-feed (Akahu)
   priority.
3. **Accountant/reviewer mode**: should v0.1 export a working-paper pack (trial balance,
   adjustment journals with provenance, category audit trail) for the reviewer? Cheap to
   build given the ledger design; high trust value — and ~every org over $550k opex
   needs a reviewer anyway.
4. **Liability posture**: disclaimers, professional review nudges, and whether the tool
   should *refuse* to export with blockers vs allow-with-watermark ("DRAFT — issues
   outstanding").
5. **Te reo Māori / accessibility commitments** for v0.1 vs later.
6. **Charities Register pre-fill**: pulling an org's prior filed report to seed
   comparatives and categories is a killer onboarding feature — confirm appetite and
   check register API terms.
7. **Non-charity small societies** (< $50k, non-donee): serve them with the Tier 4
   format anyway (recommended), or build a separate minimal-requirements output?
