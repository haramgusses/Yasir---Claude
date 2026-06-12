"use client";

export default function PrintButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => window.print()}
      title={disabled ? "Resolve the items below first" : "Print or save as PDF"}
      className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm text-white hover:bg-emerald-800 disabled:opacity-40">
      Print draft
    </button>
  );
}
