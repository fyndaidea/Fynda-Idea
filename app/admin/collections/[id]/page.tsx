import { CollectionEditorClient } from "@/components/admin/CollectionEditorClient";

export const dynamic = "force-dynamic";

export default async function AdminCollectionEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main className="min-h-0 flex-1 overflow-y-auto">
      <CollectionEditorClient collectionId={id} />
    </main>
  );
}
