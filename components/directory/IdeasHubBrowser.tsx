"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { IdeaCard, IdeaCardSkeleton } from "@/components/directory/IdeaCard";
import type { Idea } from "@/lib/db/ideas-db";

const PAGE_SIZE = 24;

export function IdeasHubBrowser({
  initialIdeas,
  initialTotal,
  initialPage = 1,
  initialQuery = "",
}: {
  initialIdeas: Idea[];
  initialTotal: number;
  initialPage?: number;
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [ideas, setIdeas] = useState(initialIdeas);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();
  const [fetching, setFetching] = useState(false);
  const skipFirstFetch = useRef(true);
  const pageSize = PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (skipFirstFetch.current) {
      skipFirstFetch.current = false;
      return;
    }

    const handle = window.setTimeout(async () => {
      setFetching(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        params.set("page", String(Math.max(1, page)));
        params.set("pageSize", String(pageSize));
        const res = await fetch(`/api/ideas?${params.toString()}`, { credentials: "include" });
        const data = res.ok ? await res.json() : { ideas: [], total: 0 };
        startTransition(() => {
          setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
          setTotal(typeof data.total === "number" ? data.total : 0);
        });
      } catch {
        startTransition(() => {
          setIdeas([]);
          setTotal(0);
        });
      } finally {
        setFetching(false);
      }
    }, 200);

    return () => window.clearTimeout(handle);
  }, [page, pageSize, query]);

  const busy = fetching || isPending;

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[color:var(--muted)]">
            <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search ideas…"
            className="h-11 w-full rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] pl-10 pr-3 text-sm text-[color:var(--foreground)] outline-none ring-[color:var(--ring)] placeholder:text-[color:var(--muted)] focus:ring-2"
          />
        </div>
        <p className="text-sm text-[color:var(--muted)]">
          <span className="font-semibold text-[color:var(--foreground)]">{total.toLocaleString()}</span>{" "}
          ideas
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {busy && ideas.length === 0
          ? Array.from({ length: 6 }).map((_, i) => <IdeaCardSkeleton key={`sk-${i}`} />)
          : ideas.map((idea) => <IdeaCard key={idea.id} idea={idea} />)}
      </div>

      {!busy && ideas.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-6 py-12 text-center">
          <p className="text-base font-semibold text-[color:var(--foreground)]">No ideas match</p>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Try a different search.</p>
        </div>
      ) : null}

      {totalPages > 1 ? (
        <div className="mt-8 flex items-center justify-between gap-3">
          <p className="text-sm text-[color:var(--muted)]">
            Page <span className="font-semibold text-[color:var(--foreground)]">{safePage}</span> of{" "}
            <span className="font-semibold text-[color:var(--foreground)]">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1 || busy}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-4 text-sm font-semibold disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages || busy}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-4 text-sm font-semibold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
