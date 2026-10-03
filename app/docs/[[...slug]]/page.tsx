import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarkdownBody } from "@/components/docs/markdown-body";
import { showAdminDocs } from "@/lib/docs/config";
import { manifestToStaticSlugs, resolveDoc } from "@/lib/docs/resolve-doc";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export async function generateStaticParams() {
  return manifestToStaticSlugs();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parts = slug ?? [];
  const admin = parts[0] === "admin";
  const inner = admin ? parts.slice(1) : parts;
  if (admin && !showAdminDocs()) {
    return { title: "Not found" };
  }
  const doc = resolveDoc(admin, inner);
  if (!doc) {
    return { title: "Not found" };
  }
  return {
    title: `${doc.title} · Docs`,
    description: doc.description,
  };
}

export default async function DocsPage({ params }: PageProps) {
  const { slug } = await params;
  const parts = slug ?? [];

  if (parts[0] === "admin") {
    if (!showAdminDocs()) {
      notFound();
    }
    const inner = parts.slice(1);
    const doc = resolveDoc(true, inner);
    if (!doc) {
      notFound();
    }
    return <DocArticle doc={doc} />;
  }

  const doc = resolveDoc(false, parts);
  if (!doc) {
    notFound();
  }
  return <DocArticle doc={doc} />;
}

function DocArticle({
  doc,
}: {
  doc: NonNullable<Awaited<ReturnType<typeof resolveDoc>>>;
}) {
  return (
    <article>
      <header className="mb-8 border-b border-[color:var(--card-border)] pb-6">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-[color:var(--accent)]">
          {doc.kind === "admin" ? "Admin documentation" : "User guide"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--foreground)] md:text-4xl">
          {doc.title}
        </h1>
        {doc.description ? (
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[color:var(--muted)]">
            {doc.description}
          </p>
        ) : null}
      </header>
      <MarkdownBody markdown={doc.content} />
    </article>
  );
}
