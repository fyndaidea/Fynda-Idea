import Link from "next/link";

export type CollectionIdeaRowData = {
  slug: string;
  title: string;
  summary: string;
  categories?: string[];
  featured?: boolean;
};

/** Idea row on collection/category pages — matches Tech's CollectionToolRow density. */
export function CollectionIdeaRow({ idea }: { idea: CollectionIdeaRowData }) {
  const initials = idea.title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Link
      href={`/ideas/${idea.slug}`}
      className="group flex items-start gap-3 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-4 transition hover:border-[color:var(--foreground)]/15"
    >
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gradient-to-br from-[color:var(--accent)] to-[#e82b2b] text-[11px] font-bold text-white"
        aria-hidden
      >
        {initials}
      </div>
      <div className="min-w-0">
        <p className="inline-flex flex-wrap items-center gap-1.5 text-[14px] font-semibold text-[color:var(--foreground)] group-hover:text-[color:var(--accent)]">
          <span className="min-w-0">{idea.title}</span>
          {idea.featured ? (
            <span className="rounded-md bg-[color:var(--accent)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Featured
            </span>
          ) : null}
        </p>
        <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[color:var(--muted)]">{idea.summary}</p>
        {idea.categories && idea.categories.length > 0 ? (
          <p className="mt-2 text-[12px] text-[color:var(--muted-2)]">
            {idea.categories.slice(0, 2).join(" · ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
