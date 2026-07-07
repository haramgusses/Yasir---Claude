"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Upload, ListChecks, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { slug: "upload", label: "Upload & check", hint: "Add your bank statements", icon: Upload },
  { slug: "categorise", label: "Categorise", hint: "Sort your transactions", icon: ListChecks },
  { slug: "review", label: "Review & report", hint: "See your statements", icon: FileText },
] as const;

export default function StepNav({
  yearId,
  done,
  counts,
}: {
  yearId: string;
  done: { upload: boolean; categorise: boolean };
  counts: { uncategorised: number; unverified: number };
}) {
  const pathname = usePathname();

  return (
    <nav className="flex items-stretch print:hidden">
      {STEPS.map((s, i) => {
        const href = `/dashboard/${yearId}/${s.slug}`;
        const active = pathname?.startsWith(href);
        const isDone =
          (s.slug === "upload" && done.upload) ||
          (s.slug === "categorise" && done.categorise);
        const badge =
          s.slug === "categorise" && counts.uncategorised > 0
            ? counts.uncategorised
            : s.slug === "upload" && counts.unverified > 0
              ? counts.unverified
              : null;
        const Icon = s.icon;

        return (
          <div key={s.slug} className="flex flex-1 items-center">
            <Link
              href={href}
              className={cn(
                "group flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                active ? "bg-white/[0.05] shadow-card" : "hover:bg-white/[0.06]"
              )}>
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  isDone
                    ? "bg-performa-teal text-white"
                    : active
                      ? "bg-performa-navy text-white"
                      : "bg-white/[0.10] text-ink-mute group-hover:bg-white/[0.16]"
                )}>
                {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-medium",
                    active ? "text-performa-cyan" : "text-ink-soft"
                  )}>
                  {s.label}
                  {badge ? (
                    <span className="rounded-full bg-amber-400/15 px-1.5 text-xs font-semibold text-amber-300">
                      {badge}
                    </span>
                  ) : null}
                </span>
                <span className="hidden text-xs text-ink-mute sm:block">{s.hint}</span>
              </span>
            </Link>
            {i < STEPS.length - 1 && (
              <div className="mx-1 hidden h-px w-6 shrink-0 bg-white/[0.10] sm:block" />
            )}
          </div>
        );
      })}
    </nav>
  );
}
