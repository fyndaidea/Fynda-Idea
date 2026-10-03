import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { CollectionCard } from "@/components/content/CollectionCard";
import { CollectionIdeaRow } from "@/components/content/CollectionIdeaRow";
import { getCollectionWithIdeas, listCollectionSummaries } from "@/lib/db/collections-db";
import { absoluteUrl, breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo/json-ld";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getCollectionWithIdeas(slug).catch(() => null);
  if (!data) return { title: "Collection not found" };
  const description =
    data.collection.description ||
    `Browse ${data.ideas.length} idea${data.ideas.length === 1 ? "" : "s"} in ${data.collection.title}.`;
  const url = absoluteUrl(`/collections/${data.collection.slug}`);
  return {
    title: data.collection.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: data.collection.title,
      description,
      url,
      type: "website",
    },
  };
}

export default async function CollectionDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getCollectionWithIdeas(slug).catch(() => null);
  if (!data) notFound();
  const { collection, ideas } = data;

  const related = (await listCollectionSummaries({ limit: 8 }).catch(() => []))
    .filter((c) => c.slug !== collection.slug)
    .slice(0, 3);

  const path = `/collections/${collection.slug}`;
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Collections", path: "/collections" },
    { name: collection.title, path },
  ]);
  const pageLd = collectionPageJsonLd({
    name: collection.title,
    description: collection.description,
    path,
  });

  return (
    <main className="bg-[color:var(--background)]">
      <Script
        id={`collection-breadcrumb-${collection.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Script
        id={`collection-page-${collection.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }}
      />
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-3 sm:pt-5">
        <nav className="mb-4 text-[13px] text-[color:var(--muted)]">
          <Link href="/" className="hover:text-[color:var(--foreground)]">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/collections" className="hover:text-[color:var(--foreground)]">
            Collections
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[color:var(--foreground)]">{collection.title}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[color:var(--foreground)] sm:text-3xl">
              {collection.title}
            </h1>
            {collection.description ? (
              <p className="mt-3 max-w-3xl text-[15px] leading-7 text-[color:var(--muted)]">
                {collection.description}
              </p>
            ) : null}

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
                No ideas in this collection yet.
              </p>
            )}
          </div>

          <aside className="space-y-8">
            {related.length > 0 ? (
              <div>
                <h2 className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[color:var(--muted-2)]">
                  Similar collections
                </h2>
                <div className="mt-4 space-y-3">
                  {related.map((item) => (
                    <CollectionCard key={item.id} collection={item} />
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
