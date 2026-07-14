import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Upload, ListChecks, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { yearProgress, monthlyFlow, type WorkflowStep } from "@/lib/years";
import Sparkbars from "@/components/viz/Sparkbars";
import { nzd } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import NewYearButton from "@/components/workspace/NewYearButton";
import { UserButton } from "@clerk/nextjs";
import { Logo } from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

const NEXT: Record<WorkflowStep, { label: string; icon: typeof Upload }> = {
  upload: { label: "Add bank statements", icon: Upload },
  categorise: { label: "Categorise transactions", icon: ListChecks },
  review: { label: "View your report", icon: FileText },
};

export default async function DashboardPage() {
  const { userId } = auth();
  const org = await prisma.organisation.findFirst({
    where: { clerkUserId: userId! },
    include: { years: { orderBy: { endDate: "desc" } } },
  });
  if (!org) redirect("/onboarding");

  const years = await Promise.all(
    org.years.map(async (y) => ({
      year: y,
      progress: await yearProgress(y.id),
      months: (await monthlyFlow(y.id, y.startDate, y.endDate)).map((b) => ({
        full: b.full,
        inCents: b.inCents,
        outCents: b.outCents,
      })),
    }))
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface print:hidden">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/dashboard" aria-label="Performa home">
            <Logo />
          </Link>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </header>
      <div className="mx-auto max-w-5xl animate-fade-in space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">{org.name}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Pick a financial year to keep working on its performance report.
          </p>
        </div>
        <NewYearButton />
      </div>

      <div className="space-y-4">
        {years.map(({ year, progress: p, months }) => {
          const next = NEXT[p.nextStep];
          const NextIcon = next.icon;
          const status = !p.started
            ? { tone: "slate" as const, label: "Not started" }
            : p.categoriseDone
              ? { tone: "green" as const, label: "Ready to review" }
              : { tone: "amber" as const, label: "In progress" };

          return (
            <Card key={year.id} className="overflow-hidden">
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-ink">
                      Year ended {year.endDate.toISOString().slice(0, 10)}
                    </h2>
                    <Badge tone={status.tone}>{status.label}</Badge>
                    {year.detectedTier && (
                      <Badge tone="teal">
                        {year.detectedTier === "TIER_4" ? "Tier 4" : "Tier 3"}
                      </Badge>
                    )}
                  </div>
                  {p.total > 0 ? (
                    <p className="mt-1 text-sm text-ink-mute">
                      {p.total} transactions · {nzd(p.inCents, { whole: true })} in ·{" "}
                      {nzd(p.outCents, { whole: true })} out
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-ink-mute">
                      Upload a bank statement to get started.
                    </p>
                  )}
                </div>

                <Link
                  href={`/dashboard/${year.id}/${p.nextStep}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-performa-green px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-performa-green/90">
                  <NextIcon className="h-4 w-4" />
                  {next.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {p.total > 0 && (
                <div className="flex items-end gap-6 border-t border-line bg-surface-2 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs text-ink-mute">
                      <span>
                        {p.categorised} of {p.total} categorised
                      </span>
                      <span className="font-medium text-performa-green">{p.pct}%</span>
                    </div>
                    <ProgressBar value={p.pct} className="mt-1.5" />
                  </div>
                  <div className="hidden w-44 shrink-0 sm:block">
                    <Sparkbars months={months} />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      </div>
    </div>
  );
}
