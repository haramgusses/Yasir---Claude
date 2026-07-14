"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";

export interface StepState {
  importDone: boolean;
  categoriseDone: boolean;
  reconcileDone: boolean;
  uncategorised: number;
  unverified: number;
}

const SOON = [
  { label: "Performance", n: 5 },
  { label: "Notes", n: 6 },
];

/**
 * The forest-green step sidebar from the approved mock: numbered wizard
 * steps down the left, ghosted future steps, year context at the bottom.
 * Collapses to a horizontal pill strip on small screens.
 */
export default function Sidebar({
  yearId,
  orgName,
  yearEndIso,
  steps,
}: {
  yearId: string;
  orgName: string;
  yearEndIso: string;
  steps: StepState;
}) {
  const pathname = usePathname();

  const items = [
    { slug: "upload", label: "Import", n: 1, done: steps.importDone, badge: null as number | null },
    { slug: "categorise", label: "Categorise", n: 2, done: steps.categoriseDone, badge: steps.uncategorised || null },
    { slug: "reconcile", label: "Reconcile", n: 3, done: steps.reconcileDone, badge: steps.unverified || null },
    { slug: "review", label: "Report", n: 4, done: false, badge: null },
  ];

  const Step = ({
    href,
    label,
    n,
    done,
    badge,
    active,
  }: {
    href: string;
    label: string;
    n: number;
    done: boolean;
    badge: number | null;
    active: boolean;
  }) => (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-white/[0.12] font-semibold text-white"
          : "text-white/70 hover:bg-white/[0.07] hover:text-white"
      )}>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          done
            ? "bg-performa-brand text-performa-forest"
            : active
              ? "bg-white text-performa-forest"
              : "border border-white/30 text-white/70"
        )}>
        {done ? <Check className="h-3.5 w-3.5" /> : n}
      </span>
      <span className="flex items-center gap-2">
        {label}
        {badge ? (
          <span className="rounded-full bg-amberink-soft px-1.5 text-[11px] font-semibold text-amberink">
            {badge}
          </span>
        ) : null}
      </span>
    </Link>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-performa-forest px-4 py-6 lg:flex print:hidden">
        <Link href="/dashboard" className="block px-2">
          <Logo light tagline="Performance reports" />
        </Link>

        <nav className="mt-8 flex-1 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.07] hover:text-white">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-performa-brand text-performa-forest">
              <Check className="h-3.5 w-3.5" />
            </span>
            Set up
          </Link>
          {items.map((s) => (
            <Step
              key={s.slug}
              href={`/dashboard/${yearId}/${s.slug}`}
              label={s.label}
              n={s.n}
              done={s.done}
              badge={s.badge}
              active={!!pathname?.startsWith(`/dashboard/${yearId}/${s.slug}`)}
            />
          ))}
          <div className="pt-2">
            {SOON.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/30">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs">
                  {s.n}
                </span>
                {s.label}
                <span className="rounded-full border border-white/15 px-1.5 text-[10px] uppercase tracking-wide">
                  soon
                </span>
              </div>
            ))}
          </div>
        </nav>

        <div className="border-t border-white/10 px-2 pt-4 text-xs text-white/50">
          <div className="truncate font-medium text-white/80">{orgName}</div>
          <div className="mt-0.5">Year ended {yearEndIso}</div>
        </div>
      </aside>

      {/* Mobile step strip */}
      <div className="sticky top-0 z-40 -mx-4 mb-4 flex items-center gap-1 overflow-x-auto bg-performa-forest px-4 py-2 lg:hidden print:hidden">
        <Link href="/dashboard" className="mr-2 shrink-0">
          <Logo light className="[&_div]:text-base" />
        </Link>
        {items.map((s) => {
          const active = !!pathname?.startsWith(`/dashboard/${yearId}/${s.slug}`);
          return (
            <Link
              key={s.slug}
              href={`/dashboard/${yearId}/${s.slug}`}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium",
                active ? "bg-white text-performa-forest" : "text-white/75 hover:bg-white/10"
              )}>
              {s.done ? "✓ " : `${s.n} · `}
              {s.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
