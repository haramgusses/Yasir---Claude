export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading">
      <div className="space-y-2">
        <div className="h-7 w-64 rounded-lg bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-100" />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="mt-3 h-4 w-72 max-w-full rounded bg-slate-100" />
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}
