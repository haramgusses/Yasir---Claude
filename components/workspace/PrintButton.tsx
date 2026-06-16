"use client";

export default function PrintButton({ disabled }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => window.print()}
      title={disabled ? "Resolve the items below first" : "Print or save as PDF"}
      className="rounded-lg bg-performa-teal px-3 py-1.5 text-sm text-white hover:bg-performa-navy disabled:opacity-40">
      Print draft
    </button>
  );
}
