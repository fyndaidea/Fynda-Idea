import { notFound } from "next/navigation";
import IdeaEditorClient from "@/components/admin/IdeaEditorClient";
import { listCategories } from "@/lib/db/categories-db";
import { getIdeaById } from "@/lib/db/ideas-db";

export const dynamic = "force-dynamic";

export default async function AdminEditIdeaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [idea, categories] = await Promise.all([
    getIdeaById(id),
    listCategories({ includeUnpublished: true }).catch(() => []),
  ]);
  if (!idea) notFound();
  return (
    <IdeaEditorClient
      mode="edit"
      idea={idea}
      categories={categories.map((c) => ({ id: String(c.id), name: c.name }))}
    />
  );
}
