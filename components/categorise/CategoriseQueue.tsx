"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  PartyPopper,
  ChevronRight,
  Search,
  Undo2,
  Zap,
} from "lucide-react";
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
interface DoneGroup {
  category: string;
  payee: string;
  funder: string | null;
  sourceIds: string[];
  totalCents: number;
}

const NEW = "__new__";
const FUNDER_PROMPT_MIN_CENTS = 50_000;
const BULK_CONFIDENCE = 0.85;

export default function CategoriseQueue({
  yearId,
  groups,
  categories,
  complianceOptions,
  doneGroups,
}: {
  yearId: string;
  groups: Group[];
  categories: Category[];
  complianceOptions: ComplianceOption[];
  doneGroups: DoneGroup[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"todo" | "done">("todo");
  const [query, setQuery] = useState("");
  const [dir, setDir] = useState<"all" | "in" | "out">("all");
  const [bulkBusy, setBulkBusy] = useState(false);
  // Serialise mutations client-side: bulk-accept and individual Apply must
  // not run concurrently, or overlapping groups could be allocated twice.
  const [cardsBusy, setCardsBusy] = useState(0);

  const needsFunder = (code: string, totalCents: number) =>
    !!complianceOptions.find((o) => o.code === code)?.funderPrompt &&
    totalCents >= FUNDER_PROMPT_MIN_CENTS;

  // High-confidence suggestions that don't need the funder question can be
  // accepted in one click; funder-question groups stay for individual
  // attention so granularity is never skipped.
  const bulkEligible = useMemo(
    () =>
      groups.filter(
        (g) =>
          g.suggestion &&
          g.suggestion.confidence >= BULK_CONFIDENCE &&
          !needsFunder(g.suggestion.complianceCode, g.totalCents)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups]
  );

  const filtered = useMemo(
    () =>
      groups.filter(
        (g) =>
          (dir === "all" || (dir === "in" ? g.totalCents >= 0 : g.totalCents < 0)) &&
          (query.trim() === "" || g.key.toLowerCase().includes(query.trim().toLowerCase()))
      ),
    [groups, dir, query]
  );

  const remaining = groups.reduce((n, g) => n + g.lines.length, 0);
  const doneCount = doneGroups.reduce((n, g) => n + g.sourceIds.length, 0);

  async function acceptAll() {
    setBulkBusy(true);
    let res: Response;
    try {
      res = await fetch(`/api/years/${yearId}/categorise/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignments: bulkEligible.map((g) => ({
            transactionIds: g.lines.map((l) => l.id),
            name: g.suggestion!.categoryName,
            complianceCode: g.suggestion!.complianceCode,
          })),
        }),
      });
    } catch {
      toast.error("Couldn't reach the server — check your connection and try again.");
      return;
    } finally {
      setBulkBusy(false);
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Couldn't apply the suggestions — please try again.");
      return;
    }
    const body = await res.json();
    toast.success(`${body.allocated} transactions categorised in one go.`);
    router.refresh();
  }

  async function undo(g: DoneGroup) {
    let res: Response;
    try {
      res = await fetch(`/api/years/${yearId}/categorise`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceIds: g.sourceIds }),
      });
    } catch {
      toast.error("Couldn't reach the server — check your connection and try again.");
      return;
    }
    if (!res.ok) {
      toast.error("Couldn't undo that — please try again.");
      return;
    }
    toast.success(`"${g.payee}" moved back to the queue.`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-white/[0.06] p-1 text-sm font-medium">
        <TabButton active={tab === "todo"} onClick={() => setTab("todo")}>
          To sort{remaining > 0 ? ` · ${remaining}` : ""}
        </TabButton>
        <TabButton active={tab === "done"} onClick={() => setTab("done")}>
          Sorted{doneCount > 0 ? ` · ${doneCount}` : ""}
        </TabButton>
      </div>

      {tab === "todo" && groups.length === 0 && (
        <Card className="p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-performa-teal/10">
            <PartyPopper className="h-6 w-6 text-performa-teal" />
          </div>
          <p className="mt-3 text-lg font-semibold text-ink">Every transaction is categorised</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">
            All {doneCount} transactions are sorted. Next, review your draft statements
            and check everything looks right. Spot a mistake? The Sorted tab lets you undo.
          </p>
          <a
            href={`/dashboard/${yearId}/review`}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-performa-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-performa-cyan hover:text-[#04262b]">
            Review &amp; report <ChevronRight className="h-4 w-4" />
          </a>
        </Card>
      )}

      {tab === "todo" && groups.length > 0 && (
        <>
          {bulkEligible.length > 1 && (
            <Card className="flex flex-col gap-3 border-performa-teal/30 bg-performa-teal/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-performa-teal/15">
                  <Zap className="h-4 w-4 text-performa-teal" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">
                    {bulkEligible.length} groups have confident suggestions
                  </p>
                  <p className="text-xs text-ink-soft">
                    Accept them all in one click — you can undo anything from the Sorted
                    tab. Grants that need a funder name stay here for you.
                  </p>
                </div>
              </div>
              <Button
                onClick={acceptAll}
                loading={bulkBusy}
                disabled={cardsBusy > 0}
                className="shrink-0">
                <Sparkles className="h-4 w-4" />
                Accept {bulkEligible.length} suggestions
              </Button>
            </Card>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name…"
                className="w-full rounded-lg border border-line-strong bg-white/[0.05] py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-performa-cyan"
              />
            </div>
            <div className="flex gap-1 rounded-lg bg-white/[0.06] p-1 text-xs font-medium">
              {(
                [
                  ["all", "All"],
                  ["in", "Money in"],
                  ["out", "Money out"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDir(value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 transition-colors",
                    dir === value ? "bg-white/[0.05] text-performa-cyan shadow-sm" : "text-ink-mute hover:text-ink-soft"
                  )}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-8 text-center text-sm text-ink-mute">
              Nothing matches that search — try different words or clear the filter.
            </Card>
          ) : (
            filtered.map((g) => (
              <GroupCard
                key={g.key}
                yearId={yearId}
                group={g}
                categories={categories}
                complianceOptions={complianceOptions}
                locked={bulkBusy}
                onBusyChange={(b) => setCardsBusy((n) => (b ? n + 1 : Math.max(0, n - 1)))}
                onDone={() => router.refresh()}
              />
            ))
          )}
        </>
      )}

      {tab === "done" &&
        (doneGroups.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-mute">
            Nothing sorted yet — categorised transactions will appear here, and you can
            undo any of them.
          </Card>
        ) : (
          <DoneList doneGroups={doneGroups} onUndo={undo} />
        ))}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg px-4 py-2 transition-colors",
        active ? "bg-white/[0.05] text-performa-cyan shadow-sm" : "text-ink-mute hover:text-ink-soft"
      )}>
      {children}
    </button>
  );
}

function DoneList({
  doneGroups,
  onUndo,
}: {
  doneGroups: DoneGroup[];
  onUndo: (g: DoneGroup) => Promise<void>;
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  let lastCategory = "";

  return (
    <Card className="divide-y divide-line p-2">
      {doneGroups.map((g) => {
        const showHeader = g.category !== lastCategory;
        lastCategory = g.category;
        const key = `${g.category}|${g.payee}`;
        return (
          <div key={key}>
            {showHeader && (
              <div className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-ink-mute first:pt-2">
                {g.category}
              </div>
            )}
            <div className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.06]">
              <div className="min-w-0 text-sm">
                <span className="truncate text-ink">{g.payee}</span>
                <span className="ml-2 text-xs text-ink-mute">
                  {g.sourceIds.length} transaction{g.sourceIds.length === 1 ? "" : "s"}
                  {g.funder ? ` · from ${g.funder}` : ""}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <span
                  className={cn(
                    "text-sm font-medium tabular-nums",
                    g.totalCents >= 0 ? "text-emerald-400" : "text-ink-soft"
                  )}>
                  {nzd(g.totalCents)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={busyKey === key}
                  onClick={async () => {
                    setBusyKey(key);
                    try {
                      await onUndo(g);
                    } finally {
                      setBusyKey(null);
                    }
                  }}>
                  <Undo2 className="h-3.5 w-3.5" /> Undo
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </Card>
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
  locked,
  onBusyChange,
  onDone,
}: {
  yearId: string;
  group: Group;
  categories: Category[];
  complianceOptions: ComplianceOption[];
  locked: boolean;
  onBusyChange: (busy: boolean) => void;
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
    if (!canApply || locked) return;
    setBusy(true);
    onBusyChange(true);
    let res: Response;
    try {
      res = await fetch(`/api/years/${yearId}/categorise`, {
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
    } catch {
      toast.error("Couldn't reach the server — check your connection and try again.");
      return;
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body.error ?? "Couldn't save that — please try again.");
      return;
    }
    toast.success(
      `${group.lines.length} transaction${group.lines.length === 1 ? "" : "s"} categorised.`
    );
    onDone();
  }

  const conf = group.suggestion ? confidenceBadge(group.suggestion.confidence) : null;

  return (
    <Card className="animate-rise p-4">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex min-w-0 items-center gap-3 text-left">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
              isIn ? "bg-emerald-400/10 text-emerald-400" : "bg-white/[0.06] text-ink-mute"
            )}>
            {isIn ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink">{group.key}</span>
            <span className="text-xs text-ink-mute">
              {group.lines.length} transaction{group.lines.length === 1 ? "" : "s"} ·{" "}
              <span className={isIn ? "font-medium text-emerald-400" : "font-medium text-ink-soft"}>
                {nzd(group.totalCents)} {isIn ? "in" : "out"}
              </span>
              <span className="ml-1 underline decoration-dotted">
                {expanded ? "hide" : "details"}
              </span>
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <select
            className="max-w-52 rounded-lg border border-line-strong bg-white/[0.05] px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-performa-cyan"
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
          <Button
            onClick={apply}
            disabled={!canApply || locked}
            loading={busy}
            size="sm"
            className="h-9 px-4">
            Apply
          </Button>
        </div>
      </div>

      {group.suggestion && conf && (
        <div className="mt-2 flex flex-wrap items-center gap-2 pl-12 text-xs text-ink-mute">
          <Sparkles className="h-3.5 w-3.5 text-performa-teal" />
          <span>
            Suggested:{" "}
            <span className="font-medium text-ink-soft">{group.suggestion.categoryName}</span> —{" "}
            {group.suggestion.rationale}
          </span>
          <Badge tone={conf.tone}>{conf.label}</Badge>
        </div>
      )}

      {choice === NEW && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-transparent p-3">
          <input
            className="rounded-lg border border-line-strong bg-white/[0.05] px-2 py-1.5 text-sm"
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <span className="text-xs text-ink-mute">counts as</span>
          <select
            className="rounded-lg border border-line-strong bg-white/[0.05] px-2 py-1.5 text-sm"
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
          <label className="text-xs font-medium text-performa-cyan">
            Who was this funding from? (shown in your report&apos;s grants note)
          </label>
          <input
            className="mt-1 w-full rounded-lg border border-performa-teal/40 bg-white/[0.05] px-2 py-1.5 text-sm"
            placeholder="e.g. Lottery Grants Board"
            value={funder}
            onChange={(e) => setFunder(e.target.value)}
          />
        </div>
      )}

      {expanded && (
        <ul className="mt-3 divide-y divide-line pl-12 text-xs text-ink-soft">
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
