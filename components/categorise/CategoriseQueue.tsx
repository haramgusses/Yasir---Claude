"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Line {
  id: string;
  date: string;
  amountCents: number;
  payee: string;
  particulars: string;
}
interface Group {
  key: string;
  lines: Line[];
  totalCents: number;
  suggestion: {
    complianceCode: string;
    categoryName: string;
    confidence: number;
    rationale: string;
  } | null;
}
interface Category {
  id: string;
  name: string;
  complianceCode: string;
}
interface ComplianceOption {
  code: string;
  label: string;
  funderPrompt: boolean;
}

const nzd = (cents: number) =>
  (cents / 100).toLocaleString("en-NZ", { style: "currency", currency: "NZD" });

const NEW = "__new__";
const FUNDER_PROMPT_MIN_CENTS = 50_000;

export default function CategoriseQueue({
  yearId,
  groups,
  categories,
  complianceOptions,
  doneCount,
}: {
  yearId: string;
  groups: Group[];
  categories: Category[];
  complianceOptions: ComplianceOption[];
  doneCount: number;
}) {
  const router = useRouter();

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-lg font-medium text-slate-900">All transactions categorised 🎉</p>
        <p className="mt-1 text-sm text-slate-600">
          {doneCount} transactions are allocated. Head to{" "}
          <a className="text-performa-teal underline" href={`/dashboard/${yearId}/review`}>
            Review &amp; report
          </a>{" "}
          to see your draft statements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-slate-900">
          {groups.length} group{groups.length === 1 ? "" : "s"} need your attention
        </h2>
        <span className="text-xs text-slate-500">{doneCount} transactions already done</span>
      </div>
      <p className="text-sm text-slate-600 -mt-2">
        Transactions from the same payee are grouped so one decision covers them
        all. Start at the top — the biggest amounts matter most.
      </p>
      {groups.map((g) => (
        <GroupCard key={g.key} yearId={yearId} group={g} categories={categories}
          complianceOptions={complianceOptions} onDone={() => router.refresh()} />
      ))}
    </div>
  );
}

function GroupCard({
  yearId,
  group,
  categories,
  complianceOptions,
  onDone,
}: {
  yearId: string;
  group: Group;
  categories: Category[];
  complianceOptions: ComplianceOption[];
  onDone: () => void;
}) {
  // Preselect the rule suggestion: an existing category of the same name, or
  // offer to create it. Suggestions are defaults, never auto-committed.
  const suggested = group.suggestion
    ? categories.find((c) => c.name === group.suggestion!.categoryName)
    : undefined;
  const [choice, setChoice] = useState<string>(
    suggested ? suggested.id : group.suggestion ? NEW : ""
  );
  const [newName, setNewName] = useState(group.suggestion?.categoryName ?? "");
  const [newCode, setNewCode] = useState(group.suggestion?.complianceCode ?? "T3_EXP_OTHER");
  const [funder, setFunder] = useState("");
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const activeCode =
    choice === NEW ? newCode : categories.find((c) => c.id === choice)?.complianceCode;
  const needsFunder =
    !!activeCode &&
    !!complianceOptions.find((o) => o.code === activeCode)?.funderPrompt &&
    group.totalCents >= FUNDER_PROMPT_MIN_CENTS;

  async function apply() {
    setBusy(true);
    const res = await fetch(`/api/years/${yearId}/categorise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionIds: group.lines.map((l) => l.id),
        ...(choice === NEW
          ? { newCategory: { name: newName.trim(), complianceCode: newCode } }
          : { categoryId: choice }),
        ...(needsFunder && funder.trim() ? { funderName: funder.trim() } : {}),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Couldn't save that — please try again.");
      return;
    }
    toast.success(`${group.lines.length} transaction${group.lines.length === 1 ? "" : "s"} categorised.`);
    onDone();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => setExpanded(!expanded)} className="text-left">
          <div className="font-medium text-slate-900 text-sm">{group.key}</div>
          <div className="text-xs text-slate-500">
            {group.lines.length} transaction{group.lines.length === 1 ? "" : "s"} ·{" "}
            <span className={group.totalCents >= 0 ? "text-performa-teal" : "text-slate-700"}>
              {nzd(group.totalCents)} {group.totalCents >= 0 ? "in" : "out"}
            </span>
            <span className="ml-1 underline decoration-dotted">{expanded ? "hide" : "show"}</span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <select
            className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm bg-white max-w-56"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}>
            <option value="" disabled>Choose a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
            <option value={NEW}>＋ New category…</option>
          </select>
          <button onClick={apply} disabled={busy || !choice || (choice === NEW && !newName.trim())}
            className="rounded-lg bg-performa-teal px-3 py-1.5 text-sm text-white hover:bg-performa-navy disabled:opacity-40">
            {busy ? "Saving…" : "Apply"}
          </button>
        </div>
      </div>

      {group.suggestion && (
        <div className="mt-2 text-xs text-slate-500">
          Suggestion: <span className="font-medium text-slate-700">{group.suggestion.categoryName}</span>{" "}
          — {group.suggestion.rationale}
        </div>
      )}

      {choice === NEW && (
        <div className="mt-3 flex flex-wrap gap-2 items-center rounded-lg bg-slate-50 p-3">
          <input className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm bg-white"
            placeholder="Category name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          <span className="text-xs text-slate-500">counts as</span>
          <select className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm bg-white"
            value={newCode} onChange={(e) => setNewCode(e.target.value)}>
            {complianceOptions.map((o) => (
              <option key={o.code} value={o.code}>{o.label}</option>
            ))}
          </select>
        </div>
      )}

      {needsFunder && (
        <div className="mt-3 rounded-lg bg-performa-teal/10 border border-performa-teal/30 p-3">
          <label className="text-xs font-medium text-performa-navy">
            Who was this funding from? (shown in your report&apos;s grants note)
          </label>
          <input className="mt-1 w-full rounded-lg border border-performa-teal/40 px-2 py-1.5 text-sm bg-white"
            placeholder="e.g. Lottery Grants Board" value={funder}
            onChange={(e) => setFunder(e.target.value)} />
        </div>
      )}

      {expanded && (
        <ul className="mt-3 divide-y divide-slate-100 text-xs text-slate-600">
          {group.lines.map((l) => (
            <li key={l.id} className="py-1.5 flex justify-between">
              <span>{l.date} — {l.payee || l.particulars}</span>
              <span>{nzd(l.amountCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
