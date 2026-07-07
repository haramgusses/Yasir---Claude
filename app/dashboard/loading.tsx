export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-7 w-64 rounded-lg bg-white/[0.10]" />
        <div className="h-4 w-96 max-w-full rounded bg-white/[0.06]" />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-line bg-white/[0.05] p-5">
          <div className="h-5 w-48 rounded bg-white/[0.10]" />
          <div className="mt-3 h-4 w-72 max-w-full rounded bg-white/[0.06]" />
          <div className="mt-4 h-2 w-full rounded-full bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}
