"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  CalendarClock,
  ChevronRight,
} from "lucide-react";
import BankGuides from "@/components/upload/BankGuides";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { nzd, cn } from "@/lib/utils";

interface Batch {
  id: string;
  fileName: string;
  lines: number;
  verified: boolean;
  periodStart: string | null;
  periodEnd: string | null;
  openingBalanceCents: number | null;
  closingBalanceCents: number | null;
}
interface Account {
  id: string;
  name: string;
  bankKey: string | null;
  batches: Batch[];
  gaps: { fromDate: string; toDate: string }[];
}

export default function UploadPanel({
  yearId,
  yearStart,
  yearEnd,
  accounts,
  canContinue,
}: {
  yearId: string;
  yearStart: string;
  yearEnd: string;
  accounts: Account[];
  canContinue: boolean;
}) {
  const router = useRouter();
  const [newAccount, setNewAccount] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  async function addAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!newAccount.trim()) return;
    const res = await fetch(`/api/years/${yearId}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newAccount.trim() }),
    });
    if (res.ok) {
      setNewAccount("");
      router.refresh();
    } else toast.error("Couldn't add that account.");
  }

  async function upload(accountId: string, file: File) {
    if (!/\.csv$/i.test(file.name)) {
      toast.error("Please upload a CSV file exported from your internet banking.");
      return;
    }
    setBusy(accountId);
    let res: Response;
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("accountId", accountId);
      res = await fetch(`/api/years/${yearId}/import`, { method: "POST", body: fd });
    } catch {
      toast.error("Upload failed — check your connection and try again.");
      return;
    } finally {
      setBusy(null);
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error ?? "That file couldn't be read.");
      return;
    }
    if (body.duplicates > 0) {
      toast.info(`${body.imported} new transactions added — ${body.duplicates} already uploaded were skipped.`);
    } else {
      toast.success(`${body.imported} transactions imported.`);
    }
    if (body.balanceCheck && !body.balanceCheck.ok) {
      toast.warning(body.balanceCheck.message, { duration: 10000 });
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink">Upload your bank statements</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Export each account&apos;s transactions as CSV from internet banking for the
          full year ({yearStart} to {yearEnd}) and drop them in. We check everything adds
          up before you categorise anything.
        </p>
      </div>

      {accounts.length === 0 && (
        <Card className="border-dashed p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-performa-soft">
            <Building2 className="h-6 w-6 text-performa-green" />
          </div>
          <p className="mt-3 text-sm font-medium text-ink">Start by adding a bank account</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-ink-mute">
            In your internet banking, open your transaction history and choose
            &ldquo;Export&rdquo; or &ldquo;Download&rdquo; as CSV. ANZ, ASB, BNZ, Westpac
            and Kiwibank formats are recognised automatically.
          </p>
        </Card>
      )}

      {accounts.map((a) => (
        <Card key={a.id} className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2">
                <Building2 className="h-5 w-5 text-ink-mute" />
              </span>
              <div className="font-medium text-ink">{a.name}</div>
            </div>
          </div>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(a.id);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(null);
              const f = e.dataTransfer.files?.[0];
              if (f) upload(a.id, f);
            }}
            className={cn(
              "mt-4 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed py-6 text-center transition-colors",
              dragOver === a.id
                ? "border-performa-green bg-performa-soft"
                : "border-line hover:border-performa-green/60 hover:bg-surface-2"
            )}>
            <FileSpreadsheet className="h-6 w-6 text-performa-green" />
            <span className="text-sm font-medium text-ink-soft">
              {busy === a.id ? "Reading your file…" : "Drop a CSV here, or click to choose"}
            </span>
            <span className="text-xs text-ink-mute">Exported from your internet banking</span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={busy !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(a.id, f);
                e.target.value = "";
              }}
            />
          </label>

          {a.batches.length > 0 && (
            <ul className="mt-4 divide-y divide-line">
              {a.batches.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="truncate text-ink">{b.fileName}</span>
                    <div className="text-xs text-ink-mute">
                      {b.lines} transactions
                      {b.periodStart ? ` · ${b.periodStart} → ${b.periodEnd}` : ""}
                      {b.openingBalanceCents !== null
                        ? ` · ${nzd(b.openingBalanceCents)} → ${nzd(b.closingBalanceCents ?? 0)}`
                        : ""}
                    </div>
                  </div>
                  {b.verified ? (
                    <Badge tone="green">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Balances
                    </Badge>
                  ) : (
                    <Badge tone="amber">Balance check on the Reconcile step</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}

          {a.batches.length === 0 && accounts.some((x) => x.batches.length > 0) && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amberink/30 bg-amberink-soft px-3 py-2 text-xs text-amberink">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                No statements uploaded for this account yet — if it had any activity
                this year, its transactions are missing from your report.
              </span>
            </div>
          )}

          {a.batches.length > 0 && a.gaps.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amberink/30 bg-amberink-soft px-3 py-2 text-xs text-amberink">
              <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Missing period{a.gaps.length > 1 ? "s" : ""}:{" "}
                {a.gaps.map((g) => `${g.fromDate} to ${g.toDate}`).join(", ")} — upload
                statements covering these dates so the year is complete.
              </span>
            </div>
          )}
        </Card>
      ))}

      <form onSubmit={addAccount} className="flex gap-2">
        <input
          className="flex-1 rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-performa-green"
          placeholder='Add another account, e.g. "Everyday account" or "Savings"'
          value={newAccount}
          onChange={(e) => setNewAccount(e.target.value)}
        />
        <Button type="submit" variant="outline">
          <Plus className="h-4 w-4" /> Add account
        </Button>
      </form>

      {canContinue && (
        <Card className="flex flex-col gap-3 border-performa-green/30 bg-performa-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-performa-green" />
            <div>
              <p className="text-sm font-medium text-ink">
                All statements verified — everything adds up
              </p>
              <p className="text-xs text-ink-soft">
                Got more accounts? Add them above. Otherwise you&apos;re ready to sort
                your transactions.
              </p>
            </div>
          </div>
          <Link
            href={`/dashboard/${yearId}/categorise`}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-performa-green px-4 py-2.5 text-sm font-medium text-white hover:bg-performa-green/90">
            Continue to categorise <ChevronRight className="h-4 w-4" />
          </Link>
        </Card>
      )}

      <BankGuides />
    </div>
  );
}
