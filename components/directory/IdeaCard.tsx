"use client";

import Link from "next/link";
import FavoriteButton from "@/components/favorites/FavoriteButton";

/** Minimal fields for directory cards (full Idea or hub partials). */
export type IdeaCardModel = {
  slug: string;
  title: string;
  summary: string;
  featured?: boolean;
  categories?: string[];
  highlights?: string[];
};

export function IdeaCard({ idea }: { idea: IdeaCardModel }) {
  const categories = idea.categories ?? [];
  const highlights = idea.highlights ?? [];
  return (
    <article
      className={[
        "group relative flex h-full min-h-[12rem] flex-col rounded-2xl border p-5 transition",
        "border-[color:var(--card-border)] bg-[color:var(--card)]",
        "hover:border-[color:var(--accent-border)] hover:shadow-[var(--card-shadow)]",
      ].join(" ")}
    >
      <Link
        href={`/ideas/${idea.slug}`}
        className="absolute inset-0 z-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ring)]"
        aria-label={`View ${idea.title} details`}
      />
      <div className="pointer-events-none relative flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="text-base font-semibold tracking-tight text-[color:var(--foreground)]">
                {idea.title}
              </h3>
              {idea.featured ? (
                <span className="rounded-md bg-[color:var(--accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Featured
                </span>
              ) : null}
            </div>
            {categories.length > 0 ? (
              <p className="mt-1.5 text-xs leading-5 text-[color:var(--muted)]">
                <span className="font-serif italic text-[color:var(--muted-2)]">Idea</span>
                <span className="mx-1.5 text-[color:var(--muted-2)]" aria-hidden>
                  ·
                </span>
                {categories.slice(0, 3).join(" · ")}
              </p>
            ) : (
              <p className="mt-1.5 text-xs font-serif italic text-[color:var(--muted-2)]">Idea</p>
            )}
          </div>
          <span className="pointer-events-auto relative z-10 shrink-0">
            <FavoriteButton
              itemId={idea.slug}
              itemTitle={idea.title}
              itemSubtitle={idea.summary}
            />
          </span>
        </div>

        <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-[color:var(--muted)]">
          {idea.summary}
        </p>

        {highlights.length > 0 ? (
          <ul className="mt-4 space-y-1.5">
            {highlights.slice(0, 3).map((highlight) => (
              <li key={highlight} className="flex gap-2 text-xs leading-5 text-[color:var(--muted)]">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[color:var(--accent)]" aria-hidden />
                <span className="line-clamp-1">{highlight}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-5 border-t border-[color:var(--card-border)] pt-4">
          <Link
            href={`/ideas/${idea.slug}`}
            className="pointer-events-auto relative z-10 text-sm font-semibold text-[color:var(--accent)] transition hover:text-[color:var(--accent-hover)]"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}

export function IdeaCardSkeleton() {
  return (
    <div className="relative flex min-h-[12rem] flex-col rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5">
      <div className="space-y-3">
        <div className="relative h-4 w-2/3 overflow-hidden rounded">
          <div className="media-shimmer absolute inset-0">
            <span className="media-shimmer__sweep" />
          </div>
        </div>
        <div className="relative h-3 w-1/3 overflow-hidden rounded">
          <div className="media-shimmer absolute inset-0">
            <span className="media-shimmer__sweep" />
          </div>
        </div>
        <div className="relative h-3 w-full overflow-hidden rounded">
          <div className="media-shimmer absolute inset-0">
            <span className="media-shimmer__sweep" />
          </div>
        </div>
        <div className="relative h-3 w-4/5 overflow-hidden rounded">
          <div className="media-shimmer absolute inset-0">
            <span className="media-shimmer__sweep" />
          </div>
        </div>
      </div>
    </div>
  );
}
