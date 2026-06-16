"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Sparkles, PartyPopper, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { nzd, cn } from "@/lib/utils";

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
      <Card className="p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-performa-teal/10">
          <PartyPopper className="h-6 w-6 text-performa-teal" />
        </div>
        <p className="mt-3 text-lg font-semibold text-slate-900">Every transaction is categorised</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
          All {doneCount} transactions are sorted. Next, review your draft statements and
          check everything looks right.
        </p>
        <a
          href={`/dashboard/${yearId}/review`}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-performa-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-performa-navy">
          Review &amp; report <ChevronRight className="h-4 w-4" />
        </a>
      </Card>
    );
  }

  const remaining = groups.reduce((n, g) => n + g.lines.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {remaining} transaction{remaining === 1 ? "" : "s"} to sort
          </h2>
          <p className="text-sm text-slate-600">
            Grouped by who they&apos;re from or to, so one choice covers many. We&apos;ve
            suggested categories where we can — start at the top.
          </p>
        </div>
      </div>
      {groups.map((g) => (
        <GroupCard
          key={g.key}
          yearId={yearId}
          group={g}
          categories={categories}
          complianceOptions={complianceOptions}
          onDone={() => router.refresh()}
        />
      ))}
    </div>
  );
}

function confidenceBadge(confidence: number) {
  if (confidence >= 0.85) return { tone: "green" as const, label: "High confidence" };
  if (confidence >= 0.6) return { tone: "teal" as const, label: "Likely" };
  return { tone: "amber" as const, label: "Best guess" };
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
  const canApply = !!choice && !(choice === NEW && !newName.trim());
  const isIn = group.totalCents >= 0;

  async function apply() {
    if (!canApply) return;
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

  const conf = group.suggestion ? confidenceBadge(group.suggestion.confidence) : null;

  return (
    <Card className="animate-rise p-4">
      <div className="flex items-center justify-between gap-4">
        <button type="button" onClick={() => setExpanded(!expanded)} className="flex min-w-0 items-center gap-3 text-left">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              isIn ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
            )}>
            {isIn ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-slate-900">{group.key}</span>
            <span className="text-xs text-slate-500">
              {group.lines.length} transaction{group.lines.length === 1 ? "" : "s"} ·{" "}
              <span className={isIn ? "font-medium text-emerald-600" : "font-medium text-slate-700"}>
                {nzd(group.totalCents)} {isIn ? "in" : "out"}
              </span>
              <span className="ml-1 underline decoration-dotted">{expanded ? "hide" : "details"}</span>
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <select
            className="max-w-52 rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-performa-teal"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                apply();
              }
            }}>
            <option value="" disabled>
              Choose a category…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW}>＋ New category…</option>
          </select>
          <Button onClick={apply} disabled={!canApply} loading={busy} size="sm" className="h-9 px-4">
            Apply
          </Button>
        </div>
      </div>

      {group.suggestion && conf && (
        <div className="mt-2 flex items-center gap-2 pl-12 text-xs text-slate-500">
          <Sparkles className="h-3.5 w-3.5 text-performa-teal" />
          <span>
            Suggested: <span className="font-medium text-slate-700">{group.suggestion.categoryName}</span> — {group.suggestion.rationale}
          </span>
          <Badge tone={conf.tone}>{conf.label}</Badge>
        </div>
      )}

      {choice === NEW && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          <input
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <span className="text-xs text-slate-500">counts as</span>
          <select
            className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}>
            {complianceOptions.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {needsFunder && (
        <div className="mt-3 rounded-lg border border-performa-teal/30 bg-performa-teal/10 p-3">
          <label className="text-xs font-medium text-performa-navy">
            Who was this funding from? (shown in your report&apos;s grants note)
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-performa-teal/40 bg-white px-2 py-1.5 text-sm"
            placeholder="e.g. Lottery Grants Board"
            value={funder}
            onChange={(e) => setFunder(e.target.value)}
          />
        </div>
      )}

      {expanded && (
        <ul className="mt-3 divide-y divide-slate-100 pl-12 text-xs text-slate-600">
          {group.lines.map((l) => (
            <li key={l.id} className="flex justify-between py-1.5">
              <span>
                {l.date} — {l.payee || l.particulars}
              </span>
              <span className="tabular-nums">{nzd(l.amountCents)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
