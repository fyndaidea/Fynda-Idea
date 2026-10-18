"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { IDEA_PROGRESS_STATUSES, type IdeaProgress } from "@/lib/ideas/progress";
import { IdeaStatusControl } from "@/components/directory/IdeaStatusControl";
import { ShimmerBlock } from "@/components/ui/Shimmer";

export function IdeaTracker({ compact = false }: { compact?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<{ userId: string; items: IdeaProgress[] } | null>(null);
  const [error, setError] = useState<{ userId: string; message: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const [filter, setFilter] = useState("");
  const userId = user?.id;
  useEffect(() => {
    if (authLoading || !userId) return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/idea-progress", { credentials: "include", cache: "no-store", signal: controller.signal });
        if (!response.ok) throw new Error("Could not load your idea tracker.");
        const result = await response.json();
        if (!controller.signal.aborted) { setData({ userId, items: result.progress }); setError(null); }
      } catch { if (!controller.signal.aborted) setError({ userId, message: "Could not load your idea tracker." }); }
    })();
    return () => controller.abort();
  }, [authLoading, retry, userId]);

  if (userId && error?.userId === userId) return <div role="alert" className="rounded-xl border border-[color:var(--card-border)] p-5 text-sm"><p>{error.message}</p><button type="button" className="mt-2 text-[color:var(--accent)]" onClick={() => setRetry((value) => value + 1)}>Try again</button></div>;
  if (authLoading || !userId || data?.userId !== userId) return <div aria-busy="true" aria-label="Loading your idea tracker" className="space-y-3 rounded-xl border border-[color:var(--card-border)] p-5"><ShimmerBlock className="h-5 w-40" /><ShimmerBlock className="h-20 w-full" /></div>;
  const filtered = data.items.filter((item) => !filter || item.status === filter);
  const items = compact ? data.items.slice(0, 4) : filtered;
  return <section className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="dash-kicker">Your workflow</p><h2 className="mt-1 text-lg font-semibold tracking-tight">My ideas <span className="ml-1 text-sm font-normal text-[color:var(--muted-2)]">{data.items.length}</span></h2><p className="mt-1 text-xs text-[color:var(--muted)]">Your private stages, using the Idea Vault workflow.</p></div>{compact ? <Link className="text-sm text-[color:var(--accent)]" href="/dashboard?section=ideas">View tracker →</Link> : <label className="text-xs text-[color:var(--muted)]">Filter by status<select aria-label="Filter ideas by status" className="ml-2 rounded-lg border border-[color:var(--card-border)] bg-[color:var(--card)] p-2 text-[color:var(--foreground)]" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">All stages ({data.items.length})</option>{IDEA_PROGRESS_STATUSES.map((status) => <option key={status} value={status}>{status} ({data.items.filter((item) => item.status === status).length})</option>)}</select></label>}</div>
    {items.length ? <ul className="mt-5 divide-y divide-[color:var(--card-border)]">{items.map((item) => <li key={`${userId}-${item.ideaId}`} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0 lg:max-w-[55%]"><Link className="text-sm font-semibold [overflow-wrap:anywhere] hover:text-[color:var(--accent)]" href={`/ideas/${item.slug}`}>{item.title}</Link><p className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--muted)] [overflow-wrap:anywhere]">{item.summary}</p></div><IdeaStatusControl ideaId={item.ideaId} initial={{ userId, status: item.status }} onChange={(status) => setData((current) => current?.userId === userId ? { ...current, items: status ? current.items.map((row) => row.ideaId === item.ideaId ? { ...row, status } : row) : current.items.filter((row) => row.ideaId !== item.ideaId) } : current)} /></li>)}</ul> : <div className="mt-5 rounded-xl border border-dashed border-[color:var(--card-border)] p-7 text-center"><p className="text-sm text-[color:var(--muted)]">{data.items.length ? "No ideas at this stage." : "Choose a status on an idea to start tracking it here."}</p><Link href="/ideas" className="mt-3 inline-flex text-sm font-medium text-[color:var(--accent)]">Browse ideas →</Link></div>}
  </section>;
}
