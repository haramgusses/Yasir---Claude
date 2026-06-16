import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = auth();
  const org = await prisma.organisation.findFirst({
    where: { clerkUserId: userId! },
    include: { years: { orderBy: { endDate: "desc" } } },
  });
  if (!org) redirect("/onboarding");

  return (
    <div>
      <h1 className="text-xl font-semibold text-slate-900">{org.name}</h1>
      <p className="mt-1 text-sm text-slate-600">
        Financial years &mdash; pick one to continue working on its report.
      </p>
      <div className="mt-6 space-y-3">
        {org.years.map((y) => (
          <Link key={y.id} href={`/dashboard/${y.id}/upload`}
            className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-performa-teal">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">
                  Year ended {y.endDate.toISOString().slice(0, 10)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {y.status === "FINALISED" ? "Finalised" : "In progress"}
                  {y.detectedTier ? ` · ${y.detectedTier === "TIER_4" ? "Tier 4 (simple cash format)" : "Tier 3 (accrual format)"}` : ""}
                </div>
              </div>
              <span className="text-sm text-performa-teal">Open &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
