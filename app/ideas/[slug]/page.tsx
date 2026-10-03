import type { Metadata } from "next";
import Script from "next/script";
import { notFound } from "next/navigation";
import IdeaDetailPage from "@/components/directory/IdeaDetailPage";
import { getIdeaBySlug } from "@/lib/db/ideas-db";
import { absoluteUrl, breadcrumbJsonLd, collectionPageJsonLd } from "@/lib/seo/json-ld";
import { buildIdeaMetaDescription } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug).catch(() => null);
  if (!idea) return { title: "Idea not found" };
  const description = buildIdeaMetaDescription({ summary: idea.summary, body: idea.body });
  const url = absoluteUrl(`/ideas/${idea.slug}`);
  return {
    title: idea.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: idea.title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: idea.title,
      description,
    },
  };
}

export default async function IdeaSlugPage({ params }: Props) {
  const { slug } = await params;
  const idea = await getIdeaBySlug(slug).catch(() => null);
  if (!idea) notFound();

  const path = `/ideas/${idea.slug}`;
  const breadcrumb = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Ideas", path: "/ideas" },
    { name: idea.title, path },
  ]);
  const pageLd = collectionPageJsonLd({
    name: idea.title,
    description: idea.summary,
    path,
  });

  return (
    <main className="bg-[color:var(--background)]">
      <Script
        id={`idea-breadcrumb-${idea.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <Script
        id={`idea-page-${idea.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }}
      />
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-10 pt-3 sm:pb-12 sm:pt-5">
        <IdeaDetailPage idea={idea} />
      </div>
    </main>
  );
}
