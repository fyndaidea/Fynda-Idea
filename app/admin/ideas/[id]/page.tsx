import { parseIdeaLayout } from "@/components/directory/idea-layouts";
import { notFound } from "next/navigation";
import IdeaEditorClient from "@/components/admin/IdeaEditorClient";
import { listCategories } from "@/lib/db/categories-db";
import { getIdeaById } from "@/lib/db/ideas-db";

export const dynamic = "force-dynamic";

export default async function AdminEditIdeaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string; layout?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [idea, categories] = await Promise.all([
    getIdeaById(id),
    listCategories({ includeUnpublished: true }).catch(() => []),
  ]);
  if (!idea) notFound();
  return (
    <IdeaEditorClient
      mode="edit"
      returnToIdea={sp.returnTo === "idea"}
      ideaLayout={parseIdeaLayout(sp.layout)}
      idea={idea}
      categories={categories.map((c) => ({ id: String(c.id), name: c.name }))}
    />
  );
}
