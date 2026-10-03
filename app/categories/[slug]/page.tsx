import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { IdeaCard } from "@/components/directory/IdeaCard";
import { getCategoryWithIdeas, listCategorySummaries } from "@/lib/db/categories-db";
import { absoluteUrl, breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo/json-ld";
import { pageDescClass, pageTitleClass } from "@/lib/ui-classes";

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
    .slice(0, 4);

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
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 sm:pt-8">
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

        <h1 className={pageTitleClass}>{category.name}</h1>
        <p className={`${pageDescClass} text-[15px]`}>
          {category.description ||
            `${ideas.length} curated idea${ideas.length === 1 ? "" : "s"} in this category.`}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.slug} idea={idea} />
          ))}
        </div>

        {!ideas.length ? (
          <p className="mt-12 text-[color:var(--muted)]">No published ideas in this category yet.</p>
        ) : null}

        {related.length ? (
          <section className="mt-14 border-t border-[color:var(--card-border)] pt-10">
            <h2 className="text-lg font-semibold tracking-tight">More categories</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {related.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/categories/${c.slug}`}
                    className="inline-flex rounded-full border border-[color:var(--card-border)] bg-[color:var(--card)] px-3 py-1.5 text-sm font-medium transition hover:border-[color:var(--accent-border)]"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
