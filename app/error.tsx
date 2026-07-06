"use client";

import { RefreshCcw } from "lucide-react";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <p className="text-lg font-semibold text-slate-900">Something went wrong</p>
      <p className="mt-1 max-w-md text-sm text-slate-600">
        Nothing was lost — your uploads and categorising are saved. Try again, and if
        it keeps happening, sign out and back in.
      </p>
      <button
        onClick={reset}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-performa-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-performa-navy">
        <RefreshCcw className="h-4 w-4" /> Try again
      </button>
    </div>
  );
}
