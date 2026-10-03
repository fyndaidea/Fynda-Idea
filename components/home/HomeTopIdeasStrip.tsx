import Link from "next/link";
import { CollectionIdeaRow } from "@/components/content/CollectionIdeaRow";
import { listIdeas } from "@/lib/db/ideas-db";

export default async function HomeTopIdeasStrip() {
  const ideas = await listIdeas({ limit: 10 }).catch(() => []);
  if (ideas.length === 0) return null;

  return (
    <section id="top-ideas" className="mx-auto w-full max-w-6xl px-5 pb-3 pt-4 sm:px-8 lg:px-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Top 10
          </p>
          <h2 className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
            Highest-scored ideas
          </h2>
        </div>
        <Link
          href="/ideas"
          className="shrink-0 text-sm font-medium text-[color:var(--accent)] hover:underline"
        >
          All ideas →
        </Link>
      </div>
      <ol className="grid gap-3 sm:grid-cols-2">
        {ideas.map((idea, index) => (
          <li key={idea.slug} className="relative">
            <span
              className="pointer-events-none absolute left-3 top-3 z-10 grid h-6 w-6 place-items-center rounded-full border border-[color:var(--card-border)] bg-[color:var(--background)] text-[11px] font-bold text-[color:var(--muted)]"
              aria-hidden
            >
              {index + 1}
            </span>
            <div className="[&>a]:pl-12">
              <CollectionIdeaRow
                idea={{
                  slug: idea.slug,
                  title: idea.title,
                  summary: idea.summary,
                  categories: idea.categories,
                  featured: idea.featured,
                }}
              />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
