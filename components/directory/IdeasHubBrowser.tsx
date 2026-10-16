"use client";

import { Search } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, useTransition } from "react";
import { useFavoritesContext } from "@/components/favorites/FavoritesProvider";
import { IdeaCard, IdeaCardSkeleton } from "@/components/directory/IdeaCard";
import type { Idea } from "@/lib/db/ideas-db";

const PAGE_SIZE = 24;

export function IdeasHubBrowser({
  initialIdeas,
  initialTotal,
  initialPage = 1,
  initialQuery = "",
  initialUserId = null,
}: {
  initialIdeas: Idea[];
  initialTotal: number;
  initialPage?: number;
  initialQuery?: string;
  initialUserId?: string | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const [ideas, setIdeas] = useState(initialIdeas);
  const [total, setTotal] = useState(initialTotal);
  const [isPending, startTransition] = useTransition();
  const [fetching, setFetching] = useState(false);
  const { ready, isFavorite, revision, userId } = useFavoritesContext();
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [loadedKey, setLoadedKey] = useState(() => JSON.stringify([initialQuery, initialPage, initialUserId]));
  const loadedRevision = useRef(0);
  const pageSize = PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const requestKey = JSON.stringify([query, safePage, userId]);
  const navigationPending = requestKey !== loadedKey;
  const gridRef = useRef<HTMLDivElement>(null);
  const positions = useRef(new Map<string, { x: number; y: number }>());
  const visibleIdeas = useMemo(() => [...ideas].sort((a, b) =>
    Number(isFavorite(b.slug)) - Number(isFavorite(a.slug)) ||
    b.score - a.score || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() ||
    a.id.localeCompare(b.id)
  ), [ideas, isFavorite]);

  useLayoutEffect(() => {
    const nodes = gridRef.current?.querySelectorAll<HTMLElement>("[data-idea-id]");
    const next = new Map<string, { x: number; y: number }>();
    nodes?.forEach((node) => {
      const id = node.dataset.ideaId!;
      const position = { x: node.offsetLeft, y: node.offsetTop };
      const previous = positions.current.get(id);
      next.set(id, position);
      if (previous && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const dx = previous.x - position.x;
        const dy = previous.y - position.y;
        if (dx || dy) {
          node.getAnimations().forEach((animation) => animation.cancel());
          node.animate([
            { transform: `translate(${dx}px, ${dy}px)` },
            { transform: "translate(0, 0)" },
          ], { duration: 300, easing: "cubic-bezier(0.2, 0, 0, 1)" });
        }
      }
    });
    positions.current = next;
  }, [visibleIdeas, navigationPending]);

  useEffect(() => {
    if (!ready || (requestKey === loadedKey && revision === loadedRevision.current && retry === 0)) return;
    const controller = new AbortController();
    const handle = window.setTimeout(async () => {
      setFetching(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        params.set("page", String(safePage));
        params.set("pageSize", String(pageSize));
        params.set("favoritesFirst", "1");
        const res = await fetch(`/api/ideas?${params.toString()}`, {
          credentials: "include", signal: controller.signal, cache: "no-store",
        });
        if (!res.ok) throw new Error("Could not load ideas");
        const data = await res.json();
        if (controller.signal.aborted) return;
        loadedRevision.current = revision;
        startTransition(() => {
          setIdeas(Array.isArray(data.ideas) ? data.ideas : []);
          setTotal(typeof data.total === "number" ? data.total : 0);
          setLoadedKey(requestKey);
          setRetry(0);
        });
      } catch {
        if (!controller.signal.aborted) setError("Could not load ideas. Please try again.");
      } finally {
        if (!controller.signal.aborted) setFetching(false);
      }
    }, navigationPending && query !== initialQuery ? 200 : 0);
    return () => { window.clearTimeout(handle); controller.abort(); };
  }, [safePage, query, pageSize, ready, revision, userId, requestKey, loadedKey, retry, navigationPending, initialQuery]);

  const busy = fetching || isPending || (navigationPending && !error);
  const showSkeleton = navigationPending && !error;

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

      <div ref={gridRef} aria-busy={busy} aria-label="Ideas" className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {showSkeleton
          ? Array.from({ length: 6 }).map((_, i) => <IdeaCardSkeleton key={`sk-${i}`} />)
          : visibleIdeas.map((idea) => <div key={idea.id} data-idea-id={idea.id}><IdeaCard idea={idea} /></div>)}
      </div>

      {error ? (
        <div role="alert" className="mt-4 flex items-center justify-between gap-3 text-sm">
          <p>{error}</p>
          <button type="button" onClick={() => setRetry((value) => value + 1)} className="font-semibold text-[color:var(--accent)]">Try again</button>
        </div>
      ) : null}
      <p role="status" className="sr-only">{busy ? "Updating ideas" : "Ideas loaded"}</p>
      {!busy && !error && ideas.length === 0 ? (
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
              onClick={() => setPage(Math.max(1, safePage - 1))}
              className="inline-flex h-10 items-center justify-center rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-4 text-sm font-semibold disabled:opacity-50"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages || busy}
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
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
