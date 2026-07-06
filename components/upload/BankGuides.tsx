import { ChevronDown } from "lucide-react";

// Empty states that teach (PLAN §3): exactly where the CSV export lives in
// each bank's internet banking. Kept short and current-ish — menus move, so
// each ends with the phrase to search in the bank's help.
const GUIDES: { bank: string; steps: string[] }[] = [
  {
    bank: "ANZ",
    steps: [
      "Log in to ANZ Internet Banking and open the account.",
      "Choose “Transactions”, set the date range to your financial year.",
      "Click “Export” and pick CSV.",
      "If stuck, search ANZ help for “export transactions”.",
    ],
  },
  {
    bank: "ASB",
    steps: [
      "Log in to FastNet Classic and open the account.",
      "Go to “Transactions” and set the date range.",
      "Choose “Export” → CSV format.",
      "If stuck, search ASB help for “export transactions CSV”.",
    ],
  },
  {
    bank: "BNZ",
    steps: [
      "Log in to BNZ Internet Banking and open the account.",
      "Open “Statements & transactions”, set the date range.",
      "Select “Export” and choose CSV.",
      "If stuck, search BNZ help for “download transactions”.",
    ],
  },
  {
    bank: "Westpac",
    steps: [
      "Log in to Westpac One and open the account.",
      "Choose “Search transactions”, set the date range.",
      "Click “Export” and pick CSV.",
      "If stuck, search Westpac help for “export transactions”.",
    ],
  },
  {
    bank: "Kiwibank",
    steps: [
      "Log in to Kiwibank internet banking and open the account.",
      "Go to “Search transactions”, set the date range.",
      "Choose “Download” → CSV (this export includes a balance column, which lets us verify automatically).",
      "If stuck, search Kiwibank help for “download transactions”.",
    ],
  },
];

export default function BankGuides() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-900">
        How do I get a CSV from my bank?
      </p>
      <p className="mt-0.5 text-xs text-slate-500">
        Every NZ bank can export your transactions as a CSV file. Pick your bank:
      </p>
      <div className="mt-2 divide-y divide-slate-100">
        {GUIDES.map((g) => (
          <details key={g.bank} className="group py-1.5">
            <summary className="flex cursor-pointer list-none items-center justify-between py-1 text-sm text-slate-700 hover:text-performa-navy [&::-webkit-details-marker]:hidden">
              {g.bank}
              <ChevronDown className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
            <ol className="mb-2 ml-4 list-decimal space-y-1 text-xs text-slate-600">
              {g.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </div>
  );
}
