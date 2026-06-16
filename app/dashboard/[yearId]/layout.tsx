import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireYear, yearProgress } from "@/lib/years";
import { nzd } from "@/lib/utils";
import StepNav from "@/components/workspace/StepNav";
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
    <div className="animate-fade-in">
      <Link
        href="/dashboard"
        className="mb-3 inline-flex items-center gap-1 text-xs text-slate-500 hover:text-performa-navy print:hidden">
        <ChevronLeft className="h-3.5 w-3.5" />
        {year.org.name} · year ended {year.endDate.toISOString().slice(0, 10)}
      </Link>

      <StepNav
        yearId={year.id}
        done={{ upload: p.uploadDone, categorise: p.categoriseDone }}
        counts={{ uncategorised: p.uncategorised, unverified: p.unverified }}
      />

      {p.total > 0 && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-card sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                {p.categorised} of {p.total} transactions categorised
              </span>
              <span className="font-medium text-performa-navy">{p.pct}%</span>
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

      <div className="mt-6">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "in" | "out" | "net" }) {
  return (
    <div className="text-right">
      <div className="text-[11px] uppercase tracking-wide text-slate-400">{label}</div>
      <div
        className={
          tone === "in"
            ? "font-semibold tabular-nums text-emerald-600"
            : tone === "out"
              ? "font-semibold tabular-nums text-slate-700"
              : "font-semibold tabular-nums text-performa-navy"
        }>
        {value}
      </div>
    </div>
  );
}
