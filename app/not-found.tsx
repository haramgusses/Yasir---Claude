import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Logo className="mb-6" />
      <p className="text-lg font-semibold text-slate-900">That page doesn&apos;t exist</p>
      <p className="mt-1 max-w-md text-sm text-slate-600">
        The link may be old, or the page may belong to a different account.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 rounded-lg bg-performa-teal px-4 py-2.5 text-sm font-medium text-white hover:bg-performa-navy">
        Back to your dashboard
      </Link>
    </div>
  );
}
