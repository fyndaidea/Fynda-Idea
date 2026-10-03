"use client";

import type { Idea } from "@/lib/db/ideas-db";
import { Button } from "@/components/ui";
import HeroFeaturedSpotlight from "./HeroFeaturedSpotlight";

type Props = {
  ideaCount: number;
  categoryCount?: number;
  collectionCount?: number;
  ideas: Idea[];
};

export default function HomeHero({
  ideaCount,
  categoryCount = 0,
  collectionCount = 0,
  ideas,
}: Props) {
  const hasSpotlight = ideas.length > 0;
  const summaryParts: string[] = [];
  if (ideaCount) summaryParts.push(`${ideaCount} idea${ideaCount === 1 ? "" : "s"}`);
  if (categoryCount) summaryParts.push(`${categoryCount} categor${categoryCount === 1 ? "y" : "ies"}`);
  if (collectionCount) {
    summaryParts.push(`${collectionCount} collection${collectionCount === 1 ? "" : "s"}`);
  }
  const summary = summaryParts.join(" · ");

  return (
    <section className="border-b border-[color:var(--card-border)] bg-[color:var(--card)]">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div
          className={
            hasSpotlight
              ? "grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] lg:gap-10"
              : undefined
          }
        >
          <div className="min-w-0 text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--card-border)] bg-[color:var(--background)] px-3.5 py-1.5 text-sm">
              <span className="font-semibold text-[color:var(--accent)]">★★★★★</span>
              <span className="text-[color:var(--muted)]">
                Curated ideas ·{" "}
                <strong className="text-[color:var(--foreground)]">
                  {ideaCount} idea{ideaCount === 1 ? "" : "s"}
                </strong>
              </span>
            </div>

            <h1 className="text-balance text-3xl font-bold leading-[1.1] tracking-tight text-[color:var(--foreground)] sm:text-4xl lg:text-[2.75rem]">
              Discover <span className="text-[color:var(--accent)]">startup ideas</span> worth
              building.
            </h1>

            <p className="mt-3 text-pretty text-base leading-relaxed text-[color:var(--muted)] sm:text-lg lg:max-w-lg">
              One place to browse product ideas, markets, and curated lists — save favorites and
              submit your own.
            </p>

            {summary ? (
              <p className="mt-2 text-sm font-medium text-[color:var(--muted)]">{summary}</p>
            ) : null}

            <div className="mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
              <Button href="/ideas" variant="primary" className="min-w-[160px]">
                Browse ideas
              </Button>
            </div>

            <ul className="mt-5 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              {["Product ideas", "Marketplaces", "Curated lists", "Press / to search"].map(
                (label) => (
                  <li key={label}>
                    <span className="inline-flex items-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--background)] px-2.5 py-1 text-xs font-medium text-[color:var(--muted)]">
                      {label}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>

          {hasSpotlight ? (
            <div className="w-full lg:max-w-[360px] lg:justify-self-end">
              <p className="mb-2 hidden text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)] lg:block">
                Featured ideas
              </p>
              <HeroFeaturedSpotlight ideas={ideas} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
