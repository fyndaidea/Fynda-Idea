import IdeasAdminClient from "@/components/admin/IdeasAdminClient";
import { listIdeas } from "@/lib/db/ideas-db";

export const dynamic = "force-dynamic";

export default async function AdminIdeasPage() {
  const ideas = await listIdeas({ includeDrafts: true, limit: 500 }).catch(() => []);
  return (
    <IdeasAdminClient
      ideas={ideas.map((i) => ({
        id: i.id,
        title: i.title,
        slug: i.slug,
        status: i.status,
        featured: i.featured,
        score: i.score,
      }))}
    />
  );
}
