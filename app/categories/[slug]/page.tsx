import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { CategoryCard } from "@/components/content/CategoryCard";
import { CollectionIdeaRow } from "@/components/content/CollectionIdeaRow";
import { getCategoryWithIdeas, listCategorySummaries } from "@/lib/db/categories-db";
import { absoluteUrl, breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCategoryWithIdeas(slug).catch(() => null);
  if (!data) return { title: "Category not found" };
  const description =
    data.category.description ||
    `Browse ${data.ideas.length} idea${data.ideas.length === 1 ? "" : "s"} in ${data.category.name}.`;
  const url = absoluteUrl(`/categories/${data.category.slug}`);
  return {
    title: data.category.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: data.category.name,
      description,
      url,
      type: "website",
    },
  };
}

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCategoryWithIdeas(slug).catch(() => null);
  if (!data) notFound();
  const { category, ideas } = data;

  const related = (await listCategorySummaries({ limit: 8 }).catch(() => []))
    .filter((c) => c.slug !== category.slug)
    .slice(0, 3);

  const path = `/categories/${category.slug}`;
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Categories", path: "/categories" },
    { name: category.name, path },
  ]);
  const collection = collectionPageJsonLd({
    name: category.name,
    description: category.description,
    path,
  });

  return (
    <main className="bg-[color:var(--background)]">
      <Script
        id={`category-breadcrumb-${category.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Script
        id={`category-collection-${category.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }}
      />
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-3 sm:pt-5">
        <nav className="mb-4 text-[13px] text-[color:var(--muted)]">
          <Link href="/" className="hover:text-[color:var(--foreground)]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/categories" className="hover:text-[color:var(--foreground)]">
            Categories
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[color:var(--foreground)]">{category.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
              {category.name}
            </h1>
            <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[color:var(--muted)]">
              {category.description ||
                `Ideas tagged with ${category.name.toLowerCase()}.`}
            </p>

            <p className="mt-6 text-sm text-[color:var(--muted)]">
              {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
            </p>

            {ideas.length > 0 ? (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {ideas.map((idea) => (
                  <li key={idea.slug}>
                    <CollectionIdeaRow
                      idea={{
                        slug: idea.slug,
                        title: idea.title,
                        summary: idea.summary,
                        categories: idea.categories,
                        featured: idea.featured,
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] px-5 py-8 text-center text-sm text-[color:var(--muted)]">
                No published ideas in this category yet.
              </p>
            )}
          </div>

          <aside className="space-y-8">
            {related.length > 0 ? (
              <div>
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">
                  Other categories
                </h2>
                <div className="mt-4 space-y-3">
                  {related.map((item) => (
                    <CategoryCard key={item.id} category={item} />
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
