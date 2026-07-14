import { notFound } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { requireYear, yearProgress } from "@/lib/years";
import { nzd } from "@/lib/utils";
import Sidebar from "@/components/workspace/Sidebar";
import { ProgressBar } from "@/components/ui/ProgressBar";

export default async function YearLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { yearId: string };
}) {
  const year = await requireYear(params.yearId);
  if (!year) notFound();
  const p = await yearProgress(year.id);

  return (
    <div className="min-h-screen">
      <Sidebar
        yearId={year.id}
        orgName={year.org.name}
        yearEndIso={year.endDate.toISOString().slice(0, 10)}
        steps={{
          importDone: p.uploadDone,
          categoriseDone: p.categoriseDone,
          reconcileDone: p.uploadDone && p.unverified === 0,
          uncategorised: p.uncategorised,
          unverified: p.unverified,
        }}
      />

      <div className="lg:pl-60 print:pl-0">
        <header className="hidden h-12 items-center justify-between border-b border-line bg-surface px-6 lg:flex print:hidden">
          <div className="text-sm text-ink-mute">
            <span className="font-medium text-ink">{year.org.name}</span> · year ended{" "}
            {year.endDate.toISOString().slice(0, 10)}
          </div>
          <UserButton afterSignOutUrl="/sign-in" />
        </header>

        <main className="mx-auto max-w-4xl animate-fade-in px-4 py-8 sm:px-6">
          {p.total > 0 && (
            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between print:hidden">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-xs text-ink-mute">
                  <span>
                    {p.categorised} of {p.total} transactions categorised
                  </span>
                  <span className="font-medium text-performa-green">{p.pct}%</span>
                </div>
                <ProgressBar value={p.pct} className="mt-1.5" />
              </div>
              <div className="flex gap-5 text-sm sm:pl-6">
                <Stat label="Money in" value={nzd(p.inCents, { whole: true })} tone="in" />
                <Stat label="Money out" value={nzd(p.outCents, { whole: true })} tone="out" />
                <Stat
                  label={p.surplusCents >= 0 ? "Surplus" : "Deficit"}
                  value={nzd(Math.abs(p.surplusCents), { whole: true })}
                  tone="net"
                />
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "in" | "out" | "net" }) {
  return (
    <div className="text-right">
      <div className="text-[11px] uppercase tracking-wide text-ink-mute">{label}</div>
      <div
        className={
          tone === "in"
            ? "font-mono font-semibold tabular-nums text-performa-green"
            : tone === "out"
              ? "font-mono font-semibold tabular-nums text-ink-soft"
              : "font-mono font-semibold tabular-nums text-ink"
        }>
        {value}
      </div>
    </div>
  );
}
