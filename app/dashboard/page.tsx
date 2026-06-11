export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <h1 className="text-2xl font-semibold">Financial statements, from your bank statement</h1>
      <p className="mt-3 text-muted-foreground">
        Upload your organisation&apos;s bank statement and we&apos;ll guide you to a
        compliant Tier 3 or Tier 4 performance report. Onboarding flow coming next
        &mdash; see <code>docs/PLAN.md</code> for the build plan.
      </p>
    </div>
  );
}
