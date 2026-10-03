"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { AnchoredDropdownPortal } from "@/components/ui/AnchoredDropdownPortal";
import { adminSearchInputClass } from "@/lib/admin/ui-classes";

type Result = {
  type:
    | "idea"
    | "submission"
    | "feedback"
    | "roadmap"
    | "release"
    | "category"
    | "collection"
    | "user";
  title: string;
  subtitle?: string;
  href: string;
};

function typeLabel(type: Result["type"]) {
  if (type === "idea") return "Idea";
  if (type === "feedback") return "Feedback";
  if (type === "roadmap") return "Roadmap";
  if (type === "release") return "Release";
  if (type === "category") return "Category";
  if (type === "collection") return "Collection";
  if (type === "user") return "User";
  return "Submission";
}

export function AdminSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const close = useCallback(() => setOpen(false), []);

  const trimmed = q.trim();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, Math.max(0, results.length - 1)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(0, a - 1));
      }
      if (e.key === "Enter") {
        const r = results[active];
        if (r) window.location.assign(r.href);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, results, active]);

  useEffect(() => {
    if (!trimmed) {
      abortRef.current?.abort();
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const id = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(trimmed)}`, {
          signal: ac.signal,
          credentials: "include",
        });
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = (await res.json()) as { results?: Result[] };
        const list = Array.isArray(data.results) ? data.results : [];
        setResults(list);
        setActive(0);
        setOpen(true);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => window.clearTimeout(id);
  }, [trimmed]);

  const hint = useMemo(() => {
    if (!trimmed) return "Search or jump to…";
    return "";
  }, [trimmed]);

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-[color:var(--muted-2)]">
        <Search className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={hint}
        className={`${adminSearchInputClass} pl-8 pr-14`}
      />
      <span className="pointer-events-none absolute inset-y-0 right-2 hidden items-center rounded border border-[color:var(--card-border)] px-1.5 text-[10px] font-medium text-[color:var(--muted-2)] sm:flex">
        ⌘K
      </span>

      {open && (loading || results.length > 0) ? (
        <AnchoredDropdownPortal open={open} onClose={close} anchorRef={inputRef}>
          {loading ? (
            <div className="px-3 py-2.5 text-[13px] text-[color:var(--muted)]">Searching…</div>
          ) : results.length ? (
            <div className="py-1">
              {results.map((r, idx) => (
                <Link
                  key={`${r.type}-${r.href}-${idx}`}
                  href={r.href}
                  onClick={() => setOpen(false)}
                  className={[
                    "block px-3 py-2 transition",
                    idx === active ? "bg-[color:var(--card-muted)]" : "hover:bg-[color:var(--card-muted)]",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[color:var(--foreground)]">{r.title}</p>
                      {r.subtitle ? (
                        <p className="truncate text-[12px] text-[color:var(--muted)]">{r.subtitle}</p>
                      ) : null}
                    </div>
                    <span className="shrink-0 rounded border border-[color:var(--card-border)] bg-[color:var(--background)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted)]">
                      {typeLabel(r.type)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2.5 text-[13px] text-[color:var(--muted)]">No results</div>
          )}
        </AnchoredDropdownPortal>
      ) : null}
    </div>
  );
}
