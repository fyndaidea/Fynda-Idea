import { listCategorySummaries } from "@/lib/db/categories-db";
import { CategoryCard } from "@/components/content/CategoryCard";
import { pageDescClass, pageTitleClass } from "@/lib/ui-classes";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Categories",
  description: "Browse ideas by category on Fynda Idea.",
};

export default async function CategoriesPage() {
  const categories = await listCategorySummaries().catch(() => []);

  return (
    <main className="bg-[color:var(--background)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 sm:pt-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className={pageTitleClass}>Categories</h1>
            <p className={`${pageDescClass} max-w-2xl text-[15px] leading-6`}>
              Explore ideas by theme — from products and marketplaces to AI and ops.
            </p>
          </div>
          <p className="text-sm text-[color:var(--muted)]">
            Showing {categories.length} {categories.length === 1 ? "category" : "categories"}
          </p>
        </div>

        {categories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-5 py-8 text-center text-sm text-[color:var(--muted)]">
            No categories published yet.
          </p>
        )}
      </div>
    </main>
  );
}
