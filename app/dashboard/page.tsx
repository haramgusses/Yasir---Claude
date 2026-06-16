import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Upload, ListChecks, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { yearProgress, type WorkflowStep } from "@/lib/years";
import { nzd } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";

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
    org.years.map(async (y) => ({ year: y, progress: await yearProgress(y.id) }))
  );

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{org.name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pick a financial year to keep working on its performance report.
        </p>
      </div>

      <div className="space-y-4">
        {years.map(({ year, progress: p }) => {
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
                    <h2 className="text-base font-semibold text-slate-900">
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
                    <p className="mt-1 text-sm text-slate-500">
                      {p.total} transactions · {nzd(p.inCents, { whole: true })} in ·{" "}
                      {nzd(p.outCents, { whole: true })} out
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-slate-500">
                      Upload a bank statement to get started.
                    </p>
                  )}
                </div>

                <Link
                  href={`/dashboard/${year.id}/${p.nextStep}`}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-performa-teal px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-performa-navy">
                  <NextIcon className="h-4 w-4" />
                  {next.label}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {p.total > 0 && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {p.categorised} of {p.total} categorised
                    </span>
                    <span className="font-medium text-performa-navy">{p.pct}%</span>
                  </div>
                  <ProgressBar value={p.pct} className="mt-1.5" />
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
