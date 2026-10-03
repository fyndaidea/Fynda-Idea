import Link from "next/link";
import type { CategorySummary } from "@/lib/db/categories-db";

export function CategoryCard({ category }: { category: CategorySummary }) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group flex h-full flex-col rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-5 transition hover:border-[color:var(--foreground)]/15"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">
        Category
      </p>
      <h2 className="mt-2 text-[15px] font-semibold leading-snug text-[color:var(--foreground)] group-hover:text-[color:var(--accent)]">
        {category.name}
      </h2>
      {category.description ? (
        <p className="mt-2 line-clamp-2 flex-1 text-[13px] leading-5 text-[color:var(--muted)]">
          {category.description}
        </p>
      ) : (
        <div className="flex-1" />
      )}
      <p className="mt-4 text-right text-[12px] text-[color:var(--muted-2)]">
        {category.idea_count} {category.idea_count === 1 ? "idea" : "ideas"}
      </p>
    </Link>
  );
}
