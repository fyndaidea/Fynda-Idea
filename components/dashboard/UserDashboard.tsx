"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Bookmark, Lightbulb, Settings2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { isAdminRole } from "@/lib/auth/roles";
import { PREFERENCES_DASHBOARD_QUERY } from "@/lib/auth/subscription-paths";
import type { FavoriteRow } from "@/lib/favorites/types";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { ShimmerBlock } from "@/components/ui/Shimmer";

export function greetingTitle(name: string, date = new Date()) {
  const hour = date.getHours();
  const greet =
    hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  return `${greet}, ${name}`;
}

export function firstName(name?: string | null, email?: string | null) {
  const fromName = name?.trim().split(/\s+/)[0];
  if (fromName) return fromName;
  const local = email?.split("@")[0]?.trim();
  return local || "there";
}

function hrefForFavorite(item: FavoriteRow) {
  return `/ideas/${encodeURIComponent(item.item_id)}`;
}

function FavoriteRows({ items }: { items: FavoriteRow[] }) {
  return (
    <ul className="divide-y divide-[color:var(--card-border)]">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={hrefForFavorite(item)}
            className="group flex items-center gap-3 py-3 transition first:pt-0 last:pb-0 hover:opacity-90"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background-warm)] text-[color:var(--muted)] transition group-hover:border-[color:var(--accent-border)] group-hover:text-[color:var(--accent)]">
              <Lightbulb className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-[color:var(--foreground)]">
                {item.item_title}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-[color:var(--muted)]">
                <span>Idea</span>
                {item.item_subtitle ? (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">{item.item_subtitle}</span>
                  </>
                ) : null}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function OverviewContentSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
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
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 shadow-[var(--card-shadow)]">
          <ShimmerBlock className="h-3 w-20" />
          <div className="mt-4 space-y-2">
            <ShimmerBlock className="h-10 w-full" rounded="rounded-full" />
            <ShimmerBlock className="h-10 w-full" rounded="rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardOverview() {
  const { user } = useAuth();
  const { favorites, loading, error } = useDashboardData();

  const planLabel = isAdminRole(user?.role) ? "Admin" : "Member";

  const recent = useMemo(
    () =>
      [...favorites].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [favorites]
  );

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (loading) {
    return <OverviewContentSkeleton />;
  }

  const stats = [
    { label: "Saved", value: String(favorites.length), hint: "All stars" },
    { label: "Ideas", value: String(favorites.length), hint: "Directory" },
    { label: "Plan", value: planLabel, hint: "Account" },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-4 shadow-[var(--card-shadow)]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-[color:var(--foreground)]">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-[color:var(--muted)]">{stat.hint}</p>
          </div>
        ))}
      </section>

      <section className="grid items-start gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 shadow-[var(--card-shadow)] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="dash-kicker">Saved</p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-[color:var(--foreground)]">
                Recent pins
              </h2>
            </div>
            <Link
              href="/dashboard?section=saved"
              className="shrink-0 text-sm font-semibold text-[color:var(--accent)] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="mt-5">
            {recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[color:var(--card-border)] bg-[color:var(--background-warm)]/60 px-4 py-8 text-center">
                <Bookmark
                  className="mx-auto h-5 w-5 text-[color:var(--muted-2)]"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <p className="mt-3 text-sm text-[color:var(--muted)]">
                  Nothing starred yet. Star ideas as you browse.
                </p>
                <Link
                  href="/ideas"
                  className="mt-3 inline-flex text-sm font-semibold text-[color:var(--accent)] hover:underline"
                >
                  Browse ideas →
                </Link>
              </div>
            ) : (
              <FavoriteRows items={recent.slice(0, 6)} />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 shadow-[var(--card-shadow)] sm:p-6">
          <p className="dash-kicker">Shortcuts</p>
          <div className="mt-4 grid gap-2">
            <Link
              href="/ideas"
              className="flex items-center gap-2.5 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background)] px-3 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent-border)]"
            >
              <Sparkles className="h-4 w-4 text-[color:var(--accent)]" strokeWidth={1.75} aria-hidden />
              Browse ideas
            </Link>
            <Link
              href="/submit"
              className="flex items-center gap-2.5 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background)] px-3 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent-border)]"
            >
              <Lightbulb className="h-4 w-4 text-[color:var(--muted)]" strokeWidth={1.75} aria-hidden />
              Submit an idea
            </Link>
            <Link
              href={`/dashboard?${PREFERENCES_DASHBOARD_QUERY}`}
              className="flex items-center gap-2.5 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--background)] px-3 py-3 text-sm font-semibold text-[color:var(--foreground)] transition hover:border-[color:var(--accent-border)]"
            >
              <Settings2 className="h-4 w-4 text-[color:var(--muted)]" strokeWidth={1.75} aria-hidden />
              Preferences
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function DashboardSavedSection() {
  const { favorites, loading, error } = useDashboardData();

  const sorted = useMemo(
    () =>
      [...favorites].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [favorites]
  );

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading saved items">
        <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 shadow-[var(--card-shadow)]">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <ShimmerBlock className="h-10 w-10 shrink-0" rounded="rounded-xl" />
                <div className="min-w-0 flex-1 space-y-2 py-1">
                  <ShimmerBlock className="h-3.5 w-[65%]" />
                  <ShimmerBlock className="h-3 w-[40%]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 shadow-[var(--card-shadow)] sm:p-6">
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--card-border)] bg-[color:var(--background-warm)]/60 px-4 py-10 text-center">
            <p className="text-sm text-[color:var(--muted)]">No saved ideas yet.</p>
            <Link
              href="/ideas"
              className="mt-3 inline-flex text-sm font-semibold text-[color:var(--accent)] hover:underline"
            >
              Start exploring →
            </Link>
          </div>
        ) : (
          <FavoriteRows items={sorted} />
        )}
      </div>
    </div>
  );
}

export default function UserDashboard({ embedded = false }: { embedded?: boolean }) {
  if (embedded) return <DashboardOverview />;
  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
      <DashboardOverview />
    </div>
  );
}
