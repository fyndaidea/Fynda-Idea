import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { IdeaCard } from "@/components/directory/IdeaCard";
import { getCollectionWithIdeas, listCollectionSummaries } from "@/lib/db/collections-db";
import { absoluteUrl, breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo/json-ld";
import { pageDescClass, pageTitleClass } from "@/lib/ui-classes";

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
    .slice(0, 4);

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
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 sm:pt-8">
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

        <h1 className={pageTitleClass}>{collection.title}</h1>
        <p className={`${pageDescClass} text-[15px]`}>
          {collection.description ||
            `${ideas.length} curated idea${ideas.length === 1 ? "" : "s"} in this collection.`}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ideas.map((idea) => (
            <IdeaCard key={idea.slug} idea={idea} />
          ))}
        </div>

        {!ideas.length ? (
          <p className="mt-12 text-[color:var(--muted)]">No ideas in this collection yet.</p>
        ) : null}

        {related.length ? (
          <section className="mt-14 border-t border-[color:var(--card-border)] pt-10">
            <h2 className="text-lg font-semibold tracking-tight">More collections</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {related.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/collections/${c.slug}`}
                    className="inline-flex rounded-full border border-[color:var(--card-border)] bg-[color:var(--card)] px-3 py-1.5 text-sm font-medium transition hover:border-[color:var(--accent-border)]"
                  >
                    {c.title}
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
