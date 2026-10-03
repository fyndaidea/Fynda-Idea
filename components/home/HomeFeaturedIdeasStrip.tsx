import Link from "next/link";
import { Container } from "@/components/ui";

type FeaturedIdea = {
  slug: string;
  title: string;
  summary: string;
};

export default function HomeFeaturedIdeasStrip({ ideas }: { ideas: FeaturedIdea[] }) {
  if (!ideas.length) return null;

  return (
    <section className="border-t border-[color:var(--card-border)] bg-[color:var(--background)] py-16 sm:py-20">
      <Container>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-[color:var(--foreground)]">
              Featured ideas
            </h2>
            <p className="mt-2 max-w-lg text-sm text-[color:var(--muted)]">
              A few highlights from the collection.
            </p>
          </div>
          <Link
            href="/ideas"
            className="shrink-0 text-sm font-semibold text-[color:var(--accent)] hover:underline"
          >
            All ideas →
          </Link>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.slice(0, 3).map((idea) => (
            <li key={idea.slug}>
              <Link
                href={`/ideas/${idea.slug}`}
                className="block rounded-2xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-5 py-4 transition hover:border-[color:var(--accent-border)] hover:shadow-[var(--card-shadow)]"
              >
                <p className="font-semibold tracking-tight text-[color:var(--foreground)]">
                  {idea.title}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-[color:var(--muted)]">{idea.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
