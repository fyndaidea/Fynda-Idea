"use client";

import Link from "next/link";
import {
  API_KEYS_DASHBOARD_QUERY,
  PREFERENCES_DASHBOARD_QUERY,
} from "@/lib/auth/subscription-paths";
import { ShimmerBlock } from "@/components/ui/Shimmer";

export type DashboardSection = "overview" | "saved" | "preferences" | "api";

export function resolveDashboardSection(
  group: string | null,
  tab: string | null,
  section: string | null
): DashboardSection {
  if (group === "settings" && tab === "api") return "api";
  if (group === "settings" && tab === "preferences") return "preferences";
  if (section === "saved") return "saved";
  if (section === "preferences") return "preferences";
  if (section === "api") return "api";
  if (tab === "preferences") return "preferences";
  if (tab === "api") return "api";
  return "overview";
}

const NAV: Array<{ id: DashboardSection; href: string; label: string }> = [
  { id: "overview", href: "/dashboard", label: "Home" },
  { id: "saved", href: "/dashboard?section=saved", label: "Saved" },
  { id: "preferences", href: `/dashboard?${PREFERENCES_DASHBOARD_QUERY}`, label: "Preferences" },
  { id: "api", href: `/dashboard?${API_KEYS_DASHBOARD_QUERY}`, label: "API & MCP" },
];

/** Stacked masthead — Account, title, and tabs share one left edge. */
export function DashboardMasthead({
  active,
  title,
  planLabel,
  meta,
}: {
  active: DashboardSection;
  title: string;
  planLabel: string;
  meta?: string;
}) {
  return (
    <header className="dash-masthead relative overflow-hidden border-b border-[color:var(--card-border)]">
      <div className="dash-masthead__glow" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 pt-8 sm:px-8 sm:pt-10 lg:px-10">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="dash-kicker">Account</p>
            <h1 className="mt-2 text-[clamp(1.75rem,4vw,2.75rem)] font-bold tracking-[-0.04em] text-[color:var(--foreground)]">
              {title}
            </h1>
            {meta ? (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[color:var(--muted)] sm:text-[15px]">
                {meta}
              </p>
            ) : null}
          </div>
          <span className="dash-chip mt-1 shrink-0">{planLabel}</span>
        </div>

        <nav className="-mx-3.5 mt-8 flex gap-1 overflow-x-auto pb-px" aria-label="Dashboard sections">
          {NAV.map((item) => {
            const isActive = item.id === active;
            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "dash-nav-link relative shrink-0 px-3.5 pb-3.5 pt-1 text-sm font-semibold transition",
                  isActive
                    ? "text-[color:var(--foreground)]"
                    : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                ].join(" ")}
              >
                {item.label}
                <span
                  className={[
                    "absolute inset-x-3.5 bottom-0 h-[2px] origin-left rounded-full bg-[color:var(--accent)] transition-transform duration-300",
                    isActive ? "scale-x-100" : "scale-x-0",
                  ].join(" ")}
                  aria-hidden
                />
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function DashboardPageShimmer() {
  return (
    <div className="min-h-[70vh] bg-[color:var(--background)]" aria-busy="true" aria-label="Loading dashboard">
      <header className="dash-masthead relative overflow-hidden border-b border-[color:var(--card-border)]">
        <div className="dash-masthead__glow" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-5 pt-8 sm:px-8 sm:pt-10 lg:px-10">
          <ShimmerBlock className="h-3 w-16" />
          <ShimmerBlock className="mt-3 h-10 w-[min(100%,22rem)]" rounded="rounded-lg" />
          <div className="mt-8 flex gap-6 pb-3.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerBlock key={i} className="h-4 w-16" />
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-4 shadow-[var(--card-shadow)]"
            >
              <ShimmerBlock className="h-3 w-14" />
              <ShimmerBlock className="mt-3 h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 shadow-[var(--card-shadow)]">
            <ShimmerBlock className="h-3 w-16" />
            <ShimmerBlock className="mt-2 h-6 w-40" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <ShimmerBlock className="h-10 w-10 shrink-0" rounded="rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2 py-1">
                    <ShimmerBlock className="h-3.5 w-[70%]" />
                    <ShimmerBlock className="h-3 w-[45%]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 shadow-[var(--card-shadow)]">
              <ShimmerBlock className="h-3 w-20" />
              <div className="mt-4 space-y-2">
                <ShimmerBlock className="h-10 w-full" rounded="rounded-full" />
                <ShimmerBlock className="h-10 w-full" rounded="rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
