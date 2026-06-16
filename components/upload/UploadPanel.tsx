"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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

const nzd = (cents: number | null) =>
  cents === null ? "—" : (cents / 100).toLocaleString("en-NZ", { style: "currency", currency: "NZD" });

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
          full year ({yearStart} to {yearEnd}), and upload them here. We check that
          everything adds up before you categorise anything.
        </p>
      </div>

      {accounts.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-900">Start by adding a bank account</p>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            In your internet banking, find your transaction history and choose
            &ldquo;Export&rdquo; or &ldquo;Download&rdquo; as CSV. ANZ, ASB, BNZ, Westpac
            and Kiwibank exports are recognised automatically.
          </p>
        </div>
      )}

      {accounts.map((a) => (
        <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="font-medium text-slate-900">{a.name}</div>
            <label className="cursor-pointer rounded-lg bg-performa-teal px-3 py-1.5 text-sm text-white hover:bg-performa-navy">
              {busy === a.id ? "Reading…" : "Upload CSV"}
              <input type="file" accept=".csv,text/csv" className="hidden" disabled={busy !== null}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(a.id, f);
                  e.target.value = "";
                }} />
            </label>
          </div>

          {a.batches.length > 0 && (
            <ul className="mt-3 divide-y divide-slate-100">
              {a.batches.map((b) => (
                <li key={b.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <span className="text-slate-800">{b.fileName}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {b.lines} transactions
                      {b.periodStart ? ` · ${b.periodStart} → ${b.periodEnd}` : ""}
                      {" · "}{nzd(b.openingBalanceCents)} → {nzd(b.closingBalanceCents)}
                    </span>
                  </div>
                  {b.verified ? (
                    <span className="text-xs font-medium text-performa-teal">✓ Balances</span>
                  ) : (
                    <BalanceForm yearId={yearId} batchId={b.id} onDone={() => router.refresh()} />
                  )}
                </li>
              ))}
            </ul>
          )}

          {a.batches.length > 0 && a.gaps.length > 0 && (
            <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
              Missing period{a.gaps.length > 1 ? "s" : ""}:{" "}
              {a.gaps.map((g) => `${g.fromDate} to ${g.toDate}`).join(", ")} — upload
              statements covering these dates so the year is complete.
            </div>
          )}
        </div>
      ))}

      <AddAccountForm onSubmit={addAccount} value={newAccount} setValue={setNewAccount} />
    </div>
  );
}

function AddAccountForm({
  onSubmit,
  value,
  setValue,
}: {
  onSubmit: (e: React.FormEvent) => void;
  value: string;
  setValue: (v: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex gap-2">
      <input
        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-performa-teal"
        placeholder='Add a bank account, e.g. "Everyday account" or "Savings"'
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:border-performa-teal">
        Add account
      </button>
    </form>
  );
}

// Manual balance entry for exports without a running-balance column —
// closes the verification gate (PLAN §6.2) with two numbers from the
// user's paper or PDF statement.
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
      toast.warning(body.balanceCheck?.message ?? "Those balances don't tie to the transactions.", { duration: 10000 });
    }
    onDone();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="text-xs font-medium text-amber-700 underline decoration-dotted">
        Needs balance check — enter balances
      </button>
    );
  }
  return (
    <form onSubmit={save} className="flex items-center gap-1.5">
      <input required type="number" step="0.01" placeholder="Opening $" value={opening}
        onChange={(e) => setOpening(e.target.value)}
        className="w-28 rounded border border-slate-300 px-2 py-1 text-xs bg-white" />
      <input required type="number" step="0.01" placeholder="Closing $" value={closing}
        onChange={(e) => setClosing(e.target.value)}
        className="w-28 rounded border border-slate-300 px-2 py-1 text-xs bg-white" />
      <button disabled={busy}
        className="rounded bg-performa-teal px-2 py-1 text-xs text-white disabled:opacity-40">
        Check
      </button>
    </form>
  );
}
