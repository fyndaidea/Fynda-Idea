import IdeaEditorClient from "@/components/admin/IdeaEditorClient";
import { listCategories } from "@/lib/db/categories-db";

export const dynamic = "force-dynamic";

export default async function AdminNewIdeaPage() {
  const categories = await listCategories({ includeUnpublished: true }).catch(() => []);
  return (
    <IdeaEditorClient
      mode="create"
      categories={categories.map((c) => ({ id: String(c.id), name: c.name }))}
    />
  );
}
