"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Idea } from "@/lib/db/ideas-db";

export default function HeroFeaturedSpotlight({
  ideas,
  intervalMs = 5000,
}: {
  ideas: Idea[];
  intervalMs?: number;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const list = useMemo(() => {
    const featured = ideas.filter((i) => i.featured);
    return (featured.length ? featured : ideas).slice(0, 8);
  }, [ideas]);

  useEffect(() => {
    setActive(0);
  }, [list.length]);

  const idea = list[active % Math.max(1, list.length)];

  useEffect(() => {
    if (paused || list.length <= 1) return;
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % list.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, list.length, paused]);

  if (!idea) return null;

  const initials = idea.title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--background)] p-1 shadow-[var(--card-shadow)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex gap-2 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-4">
        <Link
          href={`/ideas/${idea.slug}`}
          className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] rounded-lg"
        >
          <div className="flex items-start gap-3">
            <div
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[color:var(--accent)] to-[#e82b2b] text-xs font-bold text-white"
              aria-hidden
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{idea.title}</p>
                {idea.featured ? (
                  <span className="inline-flex items-center rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--accent)]">
                    Featured
                  </span>
                ) : null}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[color:var(--muted)]">
                {idea.summary}
              </p>
              {idea.categories.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {idea.categories.slice(0, 3).map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--card-muted)] px-2 py-0.5 text-xs text-[color:var(--muted)]"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </Link>
        <Link
          href={`/ideas/${idea.slug}`}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--card-border)] text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
          aria-label={`Open ${idea.title}`}
        >
          <ArrowUpRight className="h-4 w-4 opacity-70" strokeWidth={1.75} aria-hidden />
        </Link>
      </div>

      {list.length > 1 ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                className={[
                  "h-1.5 rounded-full transition-all",
                  i === active
                    ? "w-5 bg-[color:var(--accent)]"
                    : "w-1.5 bg-[color:var(--card-border)] hover:bg-[color:var(--muted)]",
                ].join(" ")}
                aria-label={`Show idea ${i + 1}`}
              />
            ))}
          </div>
          <div className="flex gap-0.5">
            <button
              type="button"
              onClick={() => setActive((i) => (i - 1 + list.length) % list.length)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
              aria-label="Previous"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setActive((i) => (i + 1) % list.length)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--muted)] hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
              aria-label="Next"
            >
              ›
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
