import Link from "next/link";
import { CategoryCard } from "@/components/content/CategoryCard";
import { listCategorySummaries } from "@/lib/db/categories-db";

export default async function HomeCategoriesStrip() {
  const categories = await listCategorySummaries({ limit: 6 }).catch(() => []);
  if (categories.length === 0) return null;

  return (
    <section className="border-t border-[color:var(--card-border)] bg-[color:var(--background)] py-14 sm:py-16">
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted)]">
              Browse by theme
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[color:var(--foreground)]">
              Categories
            </h2>
          </div>
          <Link
            href="/categories"
            className="shrink-0 text-sm font-medium text-[color:var(--accent)] hover:underline"
          >
            All categories →
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
