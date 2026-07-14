"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle, ChevronRight, Copy } from "lucide-react";
import CoverageTimeline, { type AccountCoverage } from "@/components/viz/CoverageTimeline";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { nzd } from "@/lib/utils";

interface Batch {
  id: string;
  fileName: string;
  lines: number;
  verified: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  openingBalanceCents: number | null;
  closingBalanceCents: number | null;
  inCents: number;
  outCents: number;
}
interface Account {
  id: string;
  name: string;
  batches: Batch[];
  gaps: { fromDate: string; toDate: string }[];
}
interface Duplicate {
  account: string;
  date: string;
  amountCents: number;
  payee: string;
  count: number;
}

/**
 * "Make it balance" — the safety check. For each statement: opening balance
 * plus money in, less money out, must equal the closing balance. The report
 * step stays blocked until every statement ties.
 */
export default function ReconcilePanel({
  yearId,
  accounts,
  coverage,
  duplicates,
}: {
  yearId: string;
  accounts: Account[];
  coverage: AccountCoverage[];
  duplicates: Duplicate[];
}) {
  const withBatches = accounts.filter((a) => a.batches.length > 0);
  const allVerified =
    withBatches.length > 0 && withBatches.every((a) => a.batches.every((b) => b.verified));
  const anyGaps = withBatches.some((a) => a.gaps.length > 0);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-performa-green">
          Step 3 · Reconcile
        </div>
        <h2 className="mt-1 text-2xl font-semibold text-ink">Make it balance</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">
          This is the safety check. For each account, your opening balance plus money in,
          less money out, must match the closing balance on your statement. If it
          doesn&apos;t tie, a transaction is missing or doubled — and we won&apos;t let a
          report go out until it does.
        </p>
      </div>

      {coverage.length > 0 && (
        <Card className="p-5">
          <CoverageTimeline accounts={coverage} />
        </Card>
      )}

      {withBatches.length === 0 && (
        <Card className="p-8 text-center text-sm text-ink-mute">
          Nothing to reconcile yet — upload a bank statement on the Import step first.
        </Card>
      )}

      {withBatches.map((a) => (
        <Card key={a.id} className="p-5">
          <div className="font-medium text-ink">{a.name}</div>
          <ul className="mt-3 space-y-4">
            {a.batches.map((b) => (
              <BatchTie key={b.id} yearId={yearId} batch={b} />
            ))}
          </ul>
          {a.gaps.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border border-amberink/30 bg-amberink-soft px-3 py-2 text-xs text-amberink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Missing periods:{" "}
                {a.gaps.map((g) => `${g.fromDate} to ${g.toDate}`).join(", ")} — upload
                statements covering these dates on the Import step.
              </span>
            </div>
          )}
        </Card>
      ))}

      {duplicates.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <Copy className="h-4 w-4 text-amberink" />
            Possible duplicates
          </div>
          <p className="mt-1 text-xs text-ink-mute">
            These lines appear more than once with the same date, amount and description.
            That&apos;s sometimes real (two identical koha in one day) — but if a file was
            uploaded twice with different formatting, these are the tell.
          </p>
          <ul className="mt-3 divide-y divide-line text-sm">
            {duplicates.slice(0, 8).map((d, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0 truncate text-ink">
                  {d.payee}
                  <span className="ml-2 text-xs text-ink-mute">
                    {d.account} · {d.date} · ×{d.count}
                  </span>
                </span>
                <span className="shrink-0 font-mono tabular-nums text-ink">{nzd(d.amountCents)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {allVerified && !anyGaps && (
        <Card className="flex items-center justify-between gap-3 border-performa-green/30 bg-performa-soft p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-ink">
            <CheckCircle2 className="h-5 w-5 text-performa-green" />
            Everything ties — your numbers are trustworthy.
          </div>
          <a
            href={`/dashboard/${yearId}/review`}
            className="press inline-flex shrink-0 items-center gap-2 rounded-lg bg-performa-forest px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0d3d1c]">
            Continue to report <ChevronRight className="h-4 w-4" />
          </a>
        </Card>
      )}
    </div>
  );
}

function BatchTie({ yearId, batch: b }: { yearId: string; batch: Batch }) {
  const router = useRouter();
  const [opening, setOpening] = useState(
    b.openingBalanceCents !== null ? (b.openingBalanceCents / 100).toFixed(2) : ""
  );
  const [closing, setClosing] = useState(
    b.closingBalanceCents !== null ? (b.closingBalanceCents / 100).toFixed(2) : ""
  );
  const [busy, setBusy] = useState(false);

  const expectedClosing =
    b.openingBalanceCents !== null ? b.openingBalanceCents + b.inCents - b.outCents : null;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const o = Math.round(parseFloat(opening) * 100);
    const c = Math.round(parseFloat(closing) * 100);
    if (Number.isNaN(o) || Number.isNaN(c)) {
      toast.error("Enter both balances as they appear on your statement.");
      return;
    }
    setBusy(true);
    let res: Response;
    try {
      res = await fetch(`/api/years/${yearId}/import`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId: b.id, openingBalanceCents: o, closingBalanceCents: c }),
      });
    } catch {
      toast.error("Couldn't reach the server — check your connection and try again.");
      return;
    } finally {
      setBusy(false);
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error ?? "Couldn't save the balances.");
      return;
    }
    if (body.balanceCheck?.ok) toast.success("It balances — nice.");
    else if (body.balanceCheck?.message) toast.warning(body.balanceCheck.message, { duration: 10000 });
    router.refresh();
  }

  return (
    <li className="rounded-lg border border-line bg-surface-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 text-sm">
          <span className="font-medium text-ink">{b.fileName}</span>
          <span className="ml-2 text-xs text-ink-mute">
            {b.lines} transactions{b.periodStart ? ` · ${b.periodStart} → ${b.periodEnd}` : ""}
          </span>
        </div>
        {b.verified ? (
          <Badge tone="green">
            <CheckCircle2 className="h-3.5 w-3.5" /> Balances
          </Badge>
        ) : (
          <Badge tone="amber">Needs balances</Badge>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        <TieCell label="Money in" value={`+${nzd(b.inCents)}`} green />
        <TieCell label="Money out" value={`−${nzd(b.outCents)}`} />
        {expectedClosing !== null && (
          <TieCell label="Expected closing" value={nzd(expectedClosing)} />
        )}
        {b.closingBalanceCents !== null && (
          <TieCell label="Statement closing" value={nzd(b.closingBalanceCents)} />
        )}
      </div>

      {!b.verified && (
        <form onSubmit={save} className="mt-3 flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">
              Opening balance
            </span>
            <input
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="h-9 w-32 rounded-lg border border-line bg-surface px-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-performa-green"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">
              Closing balance
            </span>
            <input
              value={closing}
              onChange={(e) => setClosing(e.target.value)}
              inputMode="decimal"
              placeholder="0.00"
              className="h-9 w-32 rounded-lg border border-line bg-surface px-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-performa-green"
            />
          </label>
          <Button type="submit" size="sm" variant="green" loading={busy}>
            Check it balances
          </Button>
        </form>
      )}
    </li>
  );
}

function TieCell({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-mute">{label}</div>
      <div className={`font-mono tabular-nums ${green ? "text-performa-green" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
