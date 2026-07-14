"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/Button";

// Setup asks only for facts the data can't tell us (PLAN §3.5, §7):
// identity, balance date, GST, sector, prior-years spend band, and the
// public-accountability screen. Tier is computed, never asked.

const PACKS = [
  { key: "community_services", label: "Community / social services" },
  { key: "sports_club", label: "Sports or recreation club" },
  { key: "arts_culture", label: "Arts and culture" },
  { key: "marae_cultural", label: "Marae / cultural organisation" },
  { key: "environment", label: "Environment / conservation" },
  { key: "faith_based", label: "Faith-based organisation" },
  { key: "generic", label: "Something else / not sure" },
];

const inputCls =
  "w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-performa-green bg-surface";
const labelCls = "block text-sm font-medium text-ink-soft mb-1";

export default function OnboardingPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    entityKind: "OTHER",
    balanceDate: "03-31",
    gstStatus: "NOT_REGISTERED",
    sectorPack: "generic",
    priorSpendBand: "UNDER_140K",
    publicAccountability: false,
    isFirstYear: false,
  });
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      toast.error("Something went wrong saving your details. Please try again.");
      return;
    }
    const { yearId } = await res.json();
    router.push(`/dashboard/${yearId}/upload`);
  }

  return (
    <div className="relative min-h-screen">
      <div className="h-1 bg-performa-green" />
      <div className="relative z-10 mx-auto max-w-xl px-4 py-12">
        <Logo className="mb-8" />
        <h1 className="text-2xl font-semibold text-ink">
          Tell us about your organisation
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Two minutes of setup — then upload a bank statement and we&apos;ll guide
          you the rest of the way. We work out the right report format for you.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-6 rounded-xl border border-line bg-surface p-6 shadow-card">
          <div>
            <label className={labelCls} htmlFor="name">Organisation name</label>
            <input id="name" required className={inputCls} value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Kāpiti Youth Support Trust" />
          </div>

          <div>
            <label className={labelCls} htmlFor="kind">How are you registered?</label>
            <select id="kind" className={inputCls} value={form.entityKind}
              onChange={(e) => set("entityKind", e.target.value)}>
              <option value="SOCIETY_AND_CHARITY">Incorporated society, also a registered charity</option>
              <option value="CHARITABLE_TRUST">Charitable trust (registered charity)</option>
              <option value="INCORPORATED_SOCIETY">Incorporated society (not a charity)</option>
              <option value="OTHER">Other / not sure</option>
            </select>
            <p className="mt-1 text-xs text-ink-mute">
              Not sure? Check the charities register or the incorporated societies
              register — and note that societies that didn&apos;t reregister by
              5 April 2026 may no longer be incorporated.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="bal">Financial year ends on</label>
              <select id="bal" className={inputCls} value={form.balanceDate}
                onChange={(e) => set("balanceDate", e.target.value)}>
                <option value="03-31">31 March (most common)</option>
                <option value="06-30">30 June</option>
                <option value="09-30">30 September</option>
                <option value="12-31">31 December</option>
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="gst">GST registered?</label>
              <select id="gst" className={inputCls} value={form.gstStatus}
                onChange={(e) => set("gstStatus", e.target.value)}>
                <option value="NOT_REGISTERED">No</option>
                <option value="REGISTERED">Yes</option>
                <option value="UNSURE">Not sure</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="pack">What does your organisation mostly do?</label>
            <select id="pack" className={inputCls} value={form.sectorPack}
              onChange={(e) => set("sectorPack", e.target.value)}>
              {PACKS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-mute">
              This just gives you a sensible starting set of categories — you can
              rename or add your own later.
            </p>
          </div>

          <div>
            <span className={labelCls}>
              Roughly, what did the organisation spend in <em>each</em> of the last two years?
            </span>
            <div className="space-y-2 mt-2">
              {[
                ["UNDER_140K", "Under $140,000 a year"],
                ["OVER_140K", "$140,000 or more a year"],
                ["FIRST_YEAR", "This is our first year"],
                ["UNSURE", "Not sure"],
              ].map(([v, label]) => (
                <label key={v} className="flex items-center gap-2 text-sm text-ink-soft">
                  <input type="radio" name="band" checked={form.priorSpendBand === v}
                    onChange={() => {
                      set("priorSpendBand", v);
                      if (v === "FIRST_YEAR") set("isFirstYear", true);
                    }} />
                  {label}
                </label>
              ))}
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-ink-mute underline decoration-dotted">
                Why do we ask?
              </summary>
              <p className="mt-1 text-xs text-ink-mute">
                The law sets the report format by your spending over the last two
                years: under $140,000 a year means a simple cash-based report
                (Tier 4); over means a fuller one (Tier 3). A rough answer is fine —
                we double-check against your actual transactions.
              </p>
            </details>
          </div>

          <div>
            <label className="flex items-start gap-2 text-sm text-ink-soft">
              <input type="checkbox" className="mt-0.5" checked={form.publicAccountability}
                onChange={(e) => set("publicAccountability", e.target.checked)} />
              <span>
                We hold money or assets on behalf of other people or organisations
                (as a trustee, nominee or agent) — beyond ordinary grants and donations.
              </span>
            </label>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-ink-mute underline decoration-dotted">
                Why do we ask?
              </summary>
              <p className="mt-1 text-xs text-ink-mute">
                Organisations that hold others&apos; money in trust have stricter
                reporting rules. Almost all community groups can leave this unticked —
                receiving grants and donations for your own work doesn&apos;t count.
              </p>
            </details>
          </div>

          <Button type="submit" loading={busy} size="lg" className="w-full">
            {busy ? "Setting up…" : "Continue to upload"}
          </Button>
        </form>
      </div>
    </div>
  );
}
