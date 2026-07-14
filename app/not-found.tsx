import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="relative z-10 flex flex-col items-center">
      <Logo className="mb-6" />
      <p className="text-lg font-semibold text-ink">That page doesn&apos;t exist</p>
      <p className="mt-1 max-w-md text-sm text-ink-soft">
        The link may be old, or the page may belong to a different account.
      </p>
      <Link
        href="/dashboard"
        className="mt-5 rounded-lg bg-performa-green px-4 py-2.5 text-sm font-medium text-white hover:bg-performa-green/90">
        Back to your dashboard
      </Link>
      </div>
    </div>
  );
}
