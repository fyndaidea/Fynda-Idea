"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Search } from "lucide-react";

type SearchHit = {
  id: string;
  kind: "idea" | "category" | "collection";
  title: string;
  subtitle?: string;
  href: string;
};

type SiteSearchContextValue = {
  open: boolean;
  openSearch: () => void;
  closeSearch: () => void;
};

const SiteSearchContext = createContext<SiteSearchContextValue | null>(null);

export function useSiteSearch() {
  const ctx = useContext(SiteSearchContext);
  if (!ctx) throw new Error("useSiteSearch must be used within SiteSearchProvider");
  return ctx;
}

const KIND_LABEL: Record<SearchHit["kind"], string> = {
  idea: "Idea",
  category: "Category",
  collection: "Collection",
};

function SearchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <Search className={className} strokeWidth={1.75} aria-hidden />;
}

function matchesQuery(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function SiteSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openSearch = useCallback(() => setOpen(true), []);
  const closeSearch = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      const editing =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (!editing && e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SiteSearchContext.Provider value={{ open, openSearch, closeSearch }}>
      {children}
      {open ? <SiteSearchModal onClose={closeSearch} /> : null}
    </SiteSearchContext.Provider>
  );
}

export function SiteSearchTrigger({ className = "" }: { className?: string }) {
  const { openSearch } = useSiteSearch();
  return (
    <button
      type="button"
      onClick={openSearch}
      className={[
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--card-border)] text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]",
        className,
      ].join(" ")}
      aria-label="Search ideas"
      title="Search (⌘K or /)"
    >
      <SearchIcon className="h-[18px] w-[18px]" />
    </button>
  );
}

function SiteSearchModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [entered, setEntered] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
    const id = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const trimmed = q.trim();
    if (!trimmed) {
      abortRef.current?.abort();
      setHits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const query = encodeURIComponent(trimmed);
        const [ideasRes, categoriesRes, collectionsRes] = await Promise.all([
          fetch(`/api/ideas?q=${query}&pageSize=8`, { signal: ac.signal }),
          fetch(`/api/categories`, { signal: ac.signal }),
          fetch(`/api/collections`, { signal: ac.signal }),
        ]);

        const [ideasJson, categoriesJson, collectionsJson] = await Promise.all([
          ideasRes.ok ? ideasRes.json() : { ideas: [] },
          categoriesRes.ok ? categoriesRes.json() : { categories: [] },
          collectionsRes.ok ? collectionsRes.json() : { collections: [] },
        ]);

        if (ac.signal.aborted) return;

        const next: SearchHit[] = [];
        for (const idea of ideasJson.ideas ?? []) {
          next.push({
            id: `idea:${idea.slug}`,
            kind: "idea",
            title: idea.title,
            subtitle: idea.summary,
            href: `/ideas/${encodeURIComponent(idea.slug)}`,
          });
        }
        for (const category of categoriesJson.categories ?? []) {
          const blob = `${category.name ?? ""} ${category.slug ?? ""} ${category.description ?? ""}`;
          if (!matchesQuery(blob, trimmed)) continue;
          next.push({
            id: `category:${category.slug}`,
            kind: "category",
            title: category.name,
            subtitle: category.description || undefined,
            href: `/categories/${encodeURIComponent(category.slug)}`,
          });
          if (next.filter((h) => h.kind === "category").length >= 4) break;
        }
        for (const collection of collectionsJson.collections ?? []) {
          const blob = `${collection.title ?? ""} ${collection.slug ?? ""} ${collection.description ?? ""}`;
          if (!matchesQuery(blob, trimmed)) continue;
          next.push({
            id: `collection:${collection.slug}`,
            kind: "collection",
            title: collection.title,
            subtitle: collection.description || undefined,
            href: `/collections/${encodeURIComponent(collection.slug)}`,
          });
          if (next.filter((h) => h.kind === "collection").length >= 4) break;
        }
        setHits(next);
        setActive(0);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setHits([]);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [q]);

  const grouped = useMemo(() => {
    const order: SearchHit["kind"][] = ["idea", "category", "collection"];
    return order
      .map((kind) => ({ kind, items: hits.filter((h) => h.kind === kind) }))
      .filter((g) => g.items.length > 0);
  }, [hits]);

  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (!flat.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % flat.length);
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i - 1 + flat.length) % flat.length);
      }
      if (e.key === "Enter") {
        const hit = flat[active];
        if (hit) {
          e.preventDefault();
          go(hit.href);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, flat, go, onClose]);

  if (!portalTarget) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120000]" role="dialog" aria-modal="true" aria-label="Search">
      <button
        type="button"
        className={[
          "absolute inset-0 bg-[color:var(--foreground)]/25 backdrop-blur-[2px] transition-opacity duration-200",
          entered ? "opacity-100" : "opacity-0",
        ].join(" ")}
        aria-label="Close search"
        onClick={onClose}
      />
      <div className="pointer-events-none absolute inset-0 flex items-start justify-center px-4 pt-[12vh] sm:pt-[14vh]">
        <div
          className={[
            "pointer-events-auto w-full max-w-xl overflow-hidden rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] shadow-[0_24px_80px_rgba(0,0,0,0.18)] transition duration-200 ease-out",
            entered ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0",
          ].join(" ")}
        >
          <div className="flex items-center gap-3 border-b border-[color:var(--card-border)] px-4 py-3">
            <SearchIcon className="h-5 w-5 shrink-0 text-[color:var(--muted)]" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search ideas, categories, collections…"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-[color:var(--foreground)] outline-none placeholder:text-[color:var(--muted-2)]"
              aria-controls={listId}
              aria-autocomplete="list"
              autoComplete="off"
              spellCheck={false}
            />
            <kbd className="hidden rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted)] sm:inline">
              esc
            </kbd>
          </div>

          <div id={listId} className="max-h-[min(28rem,55vh)] overflow-y-auto overscroll-contain p-2">
            {!q.trim() ? (
              <div className="px-3 py-8 text-center text-sm text-[color:var(--muted)]">
                Type to search. Use{" "}
                <kbd className="rounded border border-[color:var(--card-border)] bg-[color:var(--card-muted)] px-1 text-[11px]">
                  ↑↓
                </kbd>{" "}
                to navigate.
              </div>
            ) : loading && hits.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-[color:var(--muted)]">Searching…</div>
            ) : hits.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-[color:var(--muted)]">
                No results for “{q.trim()}”
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.map((group) => (
                  <div key={group.kind}>
                    <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">
                      {KIND_LABEL[group.kind]}s
                    </p>
                    <ul className="space-y-0.5">
                      {group.items.map((hit) => {
                        const index = flat.findIndex((h) => h.id === hit.id);
                        const isActive = index === active;
                        return (
                          <li key={hit.id}>
                            <Link
                              href={hit.href}
                              onClick={(e) => {
                                e.preventDefault();
                                go(hit.href);
                              }}
                              onMouseEnter={() => setActive(index)}
                              className={[
                                "flex items-center gap-3 rounded-xl px-2.5 py-2 transition",
                                isActive
                                  ? "bg-[color:var(--accent-muted)] text-[color:var(--foreground)]"
                                  : "text-[color:var(--foreground)] hover:bg-[color:var(--card-muted)]",
                              ].join(" ")}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[14px] font-semibold leading-snug">
                                  {hit.title}
                                </span>
                                {hit.subtitle ? (
                                  <span className="mt-0.5 block truncate text-[12px] text-[color:var(--muted)]">
                                    {hit.subtitle}
                                  </span>
                                ) : null}
                              </span>
                              <span className="shrink-0 text-[11px] font-medium text-[color:var(--muted-2)]">
                                {KIND_LABEL[hit.kind]}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[color:var(--card-border)] px-4 py-2.5 text-[11px] text-[color:var(--muted-2)]">
            <span>
              <kbd className="rounded border border-[color:var(--card-border)] bg-[color:var(--card-muted)] px-1">⌘K</kbd>
              {" · "}
              <kbd className="rounded border border-[color:var(--card-border)] bg-[color:var(--card-muted)] px-1">/</kbd>
              {" to open"}
            </span>
            <Link
              href="/ideas"
              onClick={onClose}
              className="font-medium text-[color:var(--accent)] hover:underline"
            >
              Browse all ideas
            </Link>
          </div>
        </div>
      </div>
    </div>,
    portalTarget
  );
}
