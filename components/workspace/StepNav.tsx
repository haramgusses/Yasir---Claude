"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const STEPS = [
  { slug: "upload", label: "1 · Upload & check" },
  { slug: "categorise", label: "2 · Categorise" },
  { slug: "review", label: "3 · Review & report" },
];

export default function StepNav({
  yearId,
  badges,
}: {
  yearId: string;
  badges: Partial<Record<string, number>>;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 border-b border-slate-200 print:hidden">
      {STEPS.map((s) => {
        const href = `/dashboard/${yearId}/${s.slug}`;
        const active = pathname?.startsWith(href);
        const badge = badges[s.slug];
        return (
          <Link key={s.slug} href={href}
            className={cn(
              "px-4 py-2.5 text-sm border-b-2 -mb-px",
              active
                ? "border-performa-teal text-performa-navy font-medium"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}>
            {s.label}
            {badge ? (
              <span className="ml-2 rounded-full bg-amber-100 text-amber-800 text-xs px-2 py-0.5">
                {badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
