# NZ Nonprofit Financial Statement Tool — Product & Technical Plan

> Status: DRAFT v0.1 — regulatory figures in §2 pending verification against primary sources (XRB, Charities Services, Companies Office). Sections marked `[VERIFY]` will be confirmed before this plan is final.

A tool that takes a raw bank statement (CSV / Excel / PDF) and guides a non-accountant
through producing compliant Tier 3 / Tier 4 PBE financial statements for New Zealand
community organisations registered under the Incorporated Societies Act 2022 and/or the
Charities Act 2005.

---

## 1. The one architectural insight everything hangs off

**For a Tier 4 entity (cash basis), the bank statement effectively *is* the books.**
A Statement of Receipts and Payments is a categorised, totalled bank statement plus a
short list of resources and commitments. Tier 4 output is therefore almost fully
derivable from the upload.

**Tier 3 (accrual basis) is the cash story plus adjustments the bank statement cannot
show**: money owed to/by the organisation at year end, grants with unfulfilled
conditions, depreciation, in-kind revenue, prepayments.

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

## 2. Regulatory grounding `[VERIFY — research in progress]`

To be completed from primary sources. Items to pin down exactly:

- Current Tier 3 (NFP) / Tier 4 (NFP) standard names, effective dates, thresholds.
- Required components of each performance report, incl. Statement of Service Performance.
- Charities Act audit/review thresholds; small-charity exemptions post-2023 amendments.
- Incorporated Societies Act 2022 filing duties, small-society exemption, post-reregistration status (deadline was April 2026).
- GST presentation rules per tier; first-year comparatives exemptions; transition provisions.
- Official Charities Services templates (structure to mirror) and common filing errors.

### 2.x Flag: the Statement of Service Performance

The brief lists the financial statements but not the **Statement of Service Performance
(SSP)**. For registered charities the filing unit is the *performance report*, and the
SSP (outputs/outcomes) is a required part of it at Tier 3 and Tier 4. A tool that
produces beautiful financials without the SSP produces a **non-filable document**.
v0.1 must include a simple SSP builder (see §6.6). `[VERIFY exact SSP requirements per
tier and for non-charity incorporated societies]`

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
0. Lightweight setup      → who you are (name, balance date, registrations) — 2 minutes
1. Upload & verify        → parse statements, dedupe, verify balances tie
2. Categorise             → group + label transactions (the big middle)
3. Year-end interview     → accrual items, restricted funds, comparatives, SSP facts
4. Review & generate      → readiness checks, draft statements, fix loop
5. Export & next steps    → PDF/DOCX + "what to do now" (file with regulator, sign-off)
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
  it shrinks to ~5 questions.
- **Stage 5 exists because generating the document is not compliance.** The treasurer
  still must get committee approval, signatures, and file with Charities Services /
  the Registrar. The tool must say so explicitly or it creates false confidence.

---

## 5. The category model (the heart of the hybrid design)

### Two layers, one invariant

- **Layer 1 — Compliance categories (fixed).** The minimum revenue/expense categories
  required on the face of the statements by the Tier 3/Tier 4 standard
  `[VERIFY exact current category names]`. Users can *not* rename, delete, or remap
  these. They are the rows of the generated statements.
- **Layer 2 — Organisation categories (fully flexible).** "Youth mentoring programme",
  "Op-shop", "Lotteries grant — van purchase". Users add/rename/merge/restructure
  freely. Each Layer-2 category carries two attributes set once at creation:
  - **maps-to**: exactly one Layer-1 compliance category (suggested automatically,
    changeable from a constrained list);
  - **dimensions** (optional): programme tag, funder tag, fund-restriction tag.

**The invariant: every transaction dollar belongs to exactly one Layer-2 category, and
every Layer-2 category maps to exactly one Layer-1 category.** Statements aggregate
Layer 2 → Layer 1; notes (grants by funder, expenditure by programme) aggregate the
dimension tags. Users can therefore customise enthusiastically and *cannot* break
compliance — the worst possible outcome of a bad mapping is a miscategorised row, which
validation rules catch (e.g. "Interest received" mapped to an expense class).

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
  the major NZ funders: Lottery Grants Board, COGS, foundations — Foundation North, Rātā,
  TECT etc., gaming trusts, councils). One question, asked at the only moment the user
  has the context to answer it.
- Programme tagging is offered, not forced, at categorisation time — with a bulk "tag
  all selected" action. If the org never tags programmes, statements remain compliant
  (programme breakdown note simply isn't produced); if a funder requires it, the funder-
  report export surfaces "untagged spending" as the gap to close.
- **Never present a 40-row chart of accounts to configure upfront.** Categories surface
  through use; the full list lives in Settings for Priya.

---

## 6. Engine design

### 6.1 Parsing & import

- **v0.1 formats:** CSV and Excel from the five main banks (ANZ, ASB, BNZ, Westpac,
  Kiwibank) + a generic column-mapping fallback for anything else (user maps Date /
  Description / Amount-or-Debit/Credit columns once; mapping remembered).
  `[VERIFY each bank's export columns from citable sources]`
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
superset not a fork; an accountant can audit the workings; "show workings" view is free.

### 6.4 Suggestion engine (categorisation assistance)

Three layers, in order of trust:

1. **Deterministic NZ rules** — IRD payments, bank fees by bank, interest lines, common
   payees (insurers, councils, power/telco), payroll providers (Smartly, PaySauce, iPayroll),
   EFTPOS/Stripe/GiveALittle settlement patterns. High confidence, still confirmable.
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
`docx` library). No generative step anywhere near the numbers. Accounting policies are
templated text with computed insertions (entity name, GST status, depreciation methods
actually used); the only free text is user-authored (SSP descriptions, optional notes),
clearly editable in preview. On export, the period snapshot is frozen (model JSON +
rendered files stored); reopening a finalised period requires an explicit unlock that's
logged.

### 6.6 Statement of Service Performance builder

Three-screen mini-flow: (1) "What did you set out to do this year?" (2–5 outcome
statements, with sector examples), (2) "What did you actually do?" (countable outputs:
sessions run, people helped — number + description), (3) preview. Stored per year so
next year pre-fills. `[VERIFY minimum SSP content per tier]`

### 6.7 Validation engine

Rules with severity (`blocker` / `warning` / `note`), each with a plain-language message
and a deep link to the fix. Examples: bank balances don't tie (blocker); uncategorised
transactions remain (blocker); grant income > $X with no funder tag (warning);
"Donations" category containing round-number weekly credits that look like invoice
payments (note); negative expense category (warning); tier threshold within 10%
(warning + explanation of what changes if crossed). The pre-export checklist is just
this rule output, grouped.

---

## 7. The hard cases (from the brief's tensions & scenarios)

### Tier detection — what we actually need to ask

Upfront (setup, ~2 min): organisation name (→ registry lookup against Charities
Register / Incorporated Societies register by name/NZBN to pre-fill registration status,
balance date, charity number `[VERIFY open APIs]`), balance date, GST registered (y/n/
not sure → check IRD guidance link), and **one plain-language public-money screening
question** `[VERIFY exact criterion]`. Everything else — total expenses/payments — is
computed from the data. Tier is *provisional* at setup, *confirmed* after categorisation,
*re-checked* at export. Near-threshold orgs get the warning + a "what changes" explainer.
The two-preceding-periods measurement basis `[VERIFY]` means we ask one question about
last year's spending ("roughly: under/over $X?") rather than demanding prior statements.

### Restricted funds

Restriction is a **dimension tag, not a category**: when grant income is tagged with a
funder, one follow-up — "Can this money only be used for a specific purpose?" If yes, a
named fund is created; expenditure can be tagged against it (bulk, optional, with a
running "remaining" meter). Statements then show accumulated funds split into
restricted/unrestricted and the funds note writes itself. Unspent *conditional* grants
("use or return") are the interview's job: detected candidates (large grants late in
year with low matching spend) are asked about specifically. `[VERIFY new Tier 3
standard's liability treatment for use-or-return conditions]`

### Comparatives with no prior digital records

First-year orgs: no comparatives, statement says "First financial year — no comparative
figures" `[VERIFY first-year exemption]`. Existing orgs: a **comparatives entry screen
that mirrors the generated statement layout exactly** — user copies last year's totals
from their filed PDF (fetchable from the public register for charities — we can even
pre-fill by pulling their last filed performance report `[VERIFY register API]`). Only
Layer-1 totals are needed, ~15 numbers, with a tie-check (last year's closing balances =
this year's opening). Explicitly *not* attempting transaction-level prior-year rebuild.

### Mid-year switch from spreadsheets

Same mechanism as comparatives: bank statements still cover the whole year (banks
provide 12+ months of history), so the transaction record is complete even if their
spreadsheet only covers part of it. The spreadsheet is used as a categorisation
cross-check, not a data source. This collapses "mid-year switch" into the normal flow.

### GST

GST-registered orgs: amounts presented GST-exclusive `[VERIFY per standard]`; the bank
lines are gross, so the tool needs each category's GST treatment (defaulted per
category: most standard-rated, donations/grants typically not, bank fees exempt…) and
computes the GST portion + reconciles against actual IRD GST payments/refunds visible
in the bank data (a beautiful built-in cross-check). Non-registered: GST-inclusive,
zero extra work. v0.1 supports both but does **not** prepare GST returns — boundary
stated clearly.

### Payroll

PAYE payments to IRD and net wage payments are both visible in bank data; gross wages =
net + PAYE, so the tool can reconstruct and present "Volunteer and employee related
costs" correctly with one interview confirmation. Contractor payments (with/without WT)
asked about when payee patterns suggest it. No payroll processing — boundary stated.

### Fixed assets & depreciation (Tier 3)

Interview-driven mini asset register: large payments auto-flagged as asset candidates
("This $8,200 payment to Noel Leeming — equipment that will last years, or supplies?").
Straight-line only in v0.1, IRD-style default rates by asset class, opening balances
for pre-existing assets entered from last year's statement (or estimated with a
disclosed policy note for first-time preparers `[VERIFY transition provisions]`).

### In-kind donations & volunteer time

Interview questions with materiality guidance; recognition vs disclosure-only per the
standard's rules `[VERIFY: I believe new Tier 3 makes donated-goods recognition
optional/disclosure-based and volunteer services disclosure-only — confirm]`. Default to
the simplest compliant treatment; let Priya opt into recognition.

### Duplicates, reversals, fees

Dedupe at import (hash + fuzzy window). Reversal pairs (same amount opposite sign, same
payee, ≤ a few days) auto-matched and netted with a visible "reversed transactions"
group. Dishonour/bank fees auto-categorised by deterministic rules. Genuinely ambiguous
lines get a "Park for later" state — parked lines block export, preventing the silent
"Miscellaneous" dumping ground that reviewers hate.

---

## 8. v0.1 scope

### In

- Single organisation per account; CSV/Excel import for big-5 banks + generic mapper;
  digital-PDF behind balance verification
- Multiple bank accounts incl. transfer elimination; full verification layer
- Two-layer category model, sector starter packs, funder/programme/restriction dimensions
- Suggestion engine (rules + org memory + LLM-assist with confirm-only UX)
- Tier detection (both tiers); Tier 4 complete; Tier 3 with: AR/AP via interview,
  grants-with-conditions, basic fixed assets + straight-line depreciation, restricted
  funds, GST-exclusive presentation
- Year-end interview; SSP builder; comparatives manual entry (mirror-layout screen)
- All required statements + notes per tier, validation checklist, PDF + DOCX export
- Branding: logo + accent colour only
- "What happens next" filing guidance (not filing itself)

### Out (deliberately)

- Scanned-image PDF OCR; bank feeds (Akahu — evaluate for v2 `[VERIFY availability/cost]`)
- GST return preparation, payroll processing, invoicing/bookkeeping (this is a year-end
  tool, not Xero)
- Tier 1/2, consolidation/branches, inventory, revaluations, foreign currency
- Style-replication from prior statements (v2; high effort, zero compliance value)
- Multi-user collaboration / committee e-sign-off (v1.x; export PDF for approval instead)
- Filing API integration (none exists `[VERIFY]`)
- Audit/review execution (placeholder page + "you need a reviewer if…" rule only)

## 9. Riskiest failure modes (ranked by harm × likelihood)

1. **Silent data corruption at parse time** (PDF/CSV mis-parse) → mitigated by the
   balance-tie invariant being a hard gate. *This is why verification is stage 1.*
2. **Producing financials without the SSP** → non-filable report, user finds out from
   the regulator. Mitigated by SSP being in the core flow, not an add-on.
3. **Wrong tier near thresholds** → entire wrong format. Mitigated by computed detection,
   re-check at export, near-threshold warnings.
4. **Conditional grants recognised as income** → overstated surplus, the classic small-
   charity error. Mitigated by targeted interview detection.
5. **Coverage gaps / second bank account not uploaded** → understated activity. Mitigated
   by timeline view + an interview question ("any other accounts, term deposits, PayPal/
   Stripe balances?").
6. **GST-registered org reporting GST-inclusive** → all figures ~15% wrong. Mitigated by
   the IRD-payment cross-check.
7. **False confidence at export** ("the tool said it's compliant") → mitigated by honest
   framing: the export cover sheet states what was verified, what was user-asserted, and
   what still needs human review/approval/filing.
8. **LLM mis-categorisation accepted in bulk** → mitigated by confidence gating, payee
   grouping (errors are visible in aggregate), and validation heuristics.

## 10. Architecture on the existing stack

Keep: Next.js 14 App Router, Prisma/Postgres (Supabase), Clerk, UploadThing, shadcn/ui,
zod, react-hook-form. Add: a parsing service (server-side, Node; `xlsx`/`papaparse`;
`pdfjs` for text-layer PDFs), LLM categorisation via Claude API (batch endpoint;
suggestions only), `docx` for Word export, headless Chromium (or `@react-pdf`) for PDF.
Replace the shipping-domain Prisma schema wholesale with: `Organisation`, `FinancialYear`,
`BankAccount`, `ImportBatch`, `SourceTransaction` (immutable), `TransactionGroup`/`Split`,
`Category` (layered), `Dimension` (funder/programme/fund), `JournalEntry` (append-only),
`InterviewAnswer`, `StatementSnapshot`, `ValidationResult`. Sensitive data note: bank
transactions are personal information under the Privacy Act 2020 — NZ/AU data residency
and a clear retention policy should be decided before launch.

## 11. Open questions for the product owner

1. **Wedge and pricing**: free for Tier 4 / paid Tier 3? Who pays — the org, or funders/
   umbrella bodies sponsoring it for their grantees?
2. **Year-end tool vs year-round tool**: is the long-term ambition periodic upload
   (quarterly?) with year-end assembly, or strictly annual? Affects bank-feed priority.
3. **Accountant/reviewer mode**: should v0.1 export a working-paper pack (trial balance,
   adjustment journals with provenance, category audit trail) for the reviewer? Cheap to
   build given the ledger design; high trust value.
4. **Liability posture**: disclaimers, professional review nudges, and whether the tool
   should *refuse* to export with blockers vs allow-with-watermark ("DRAFT — issues
   outstanding").
5. **Te reo Māori / accessibility commitments** for v0.1 vs later.
6. **Charities Register pre-fill**: pulling an org's prior filed report to seed
   comparatives and categories is a killer onboarding feature — confirm appetite and
   check register API terms.
