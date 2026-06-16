"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  CalendarClock,
} from "lucide-react";
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
}: {
  yearId: string;
  yearStart: string;
  yearEnd: string;
  accounts: Account[];
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
    const fd = new FormData();
    fd.append("file", file);
    fd.append("accountId", accountId);
    const res = await fetch(`/api/years/${yearId}/import`, { method: "POST", body: fd });
    setBusy(null);
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
        <h2 className="text-lg font-semibold text-slate-900">Upload your bank statements</h2>
        <p className="mt-1 text-sm text-slate-600">
          Export each account&apos;s transactions as CSV from internet banking for the
          full year ({yearStart} to {yearEnd}) and drop them in. We check everything adds
          up before you categorise anything.
        </p>
      </div>

      {accounts.length === 0 && (
        <Card className="border-dashed p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-performa-teal/10">
            <Building2 className="h-6 w-6 text-performa-teal" />
          </div>
          <p className="mt-3 text-sm font-medium text-slate-900">Start by adding a bank account</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
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
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                <Building2 className="h-5 w-5 text-slate-500" />
              </span>
              <div className="font-medium text-slate-900">{a.name}</div>
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
                ? "border-performa-teal bg-performa-teal/5"
                : "border-slate-200 hover:border-performa-teal/60 hover:bg-slate-50"
            )}>
            <FileSpreadsheet className="h-6 w-6 text-performa-teal" />
            <span className="text-sm font-medium text-slate-700">
              {busy === a.id ? "Reading your file…" : "Drop a CSV here, or click to choose"}
            </span>
            <span className="text-xs text-slate-400">Exported from your internet banking</span>
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
            <ul className="mt-4 divide-y divide-slate-100">
              {a.batches.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="truncate text-slate-800">{b.fileName}</span>
                    <div className="text-xs text-slate-500">
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
                    <BalanceForm yearId={yearId} batchId={b.id} onDone={() => router.refresh()} />
                  )}
                </li>
              ))}
            </ul>
          )}

          {a.batches.length > 0 && a.gaps.length > 0 && (
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
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
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-performa-teal"
          placeholder='Add another account, e.g. "Everyday account" or "Savings"'
          value={newAccount}
          onChange={(e) => setNewAccount(e.target.value)}
        />
        <Button type="submit" variant="outline">
          <Plus className="h-4 w-4" /> Add account
        </Button>
      </form>
    </div>
  );
}

// Manual balance entry for exports without a running-balance column — closes
// the verification gate with two numbers from the user's statement.
function BalanceForm({
  yearId,
  batchId,
  onDone,
}: {
  yearId: string;
  batchId: string;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [opening, setOpening] = useState("");
  const [closing, setClosing] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch(`/api/years/${yearId}/import`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId,
        openingBalanceCents: Math.round(parseFloat(opening) * 100),
        closingBalanceCents: Math.round(parseFloat(closing) * 100),
      }),
    });
    setBusy(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(body.error ?? "Couldn't save those balances.");
      return;
    }
    if (body.balanceCheck?.ok) {
      toast.success("It balances — opening plus transactions matches closing.");
    } else {
      toast.warning(
        body.balanceCheck?.message ?? "Those balances don't tie to the transactions.",
        { duration: 10000 }
      );
    }
    onDone();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 hover:bg-amber-200">
        <AlertTriangle className="h-3.5 w-3.5" /> Enter balances
      </button>
    );
  }
  return (
    <form onSubmit={save} className="flex items-center gap-1.5">
      <input
        required
        type="number"
        step="0.01"
        placeholder="Opening $"
        value={opening}
        onChange={(e) => setOpening(e.target.value)}
        className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
      />
      <input
        required
        type="number"
        step="0.01"
        placeholder="Closing $"
        value={closing}
        onChange={(e) => setClosing(e.target.value)}
        className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-xs"
      />
      <Button type="submit" size="sm" loading={busy}>
        Check
      </Button>
    </form>
  );
}
