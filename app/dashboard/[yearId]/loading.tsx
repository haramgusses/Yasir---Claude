export default function YearLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-label="Loading">
      <div className="h-4 w-64 rounded bg-surface-2" />
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 flex-1 rounded-xl bg-surface-2" />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-line bg-surface p-5">
          <div className="h-4 w-56 rounded bg-line" />
          <div className="mt-3 h-3 w-full rounded bg-surface-2" />
          <div className="mt-2 h-3 w-2/3 rounded bg-surface-2" />
        </div>
      ))}
    </div>
  );
}
