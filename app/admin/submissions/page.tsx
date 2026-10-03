import SubmissionsAdminClient from "@/components/admin/SubmissionsAdminClient";
import { listIdeaSubmissions } from "@/lib/db/submissions-db";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const submissions = await listIdeaSubmissions().catch(() => []);
  return (
    <SubmissionsAdminClient
      submissions={submissions.map((s) => ({
        id: String(s.id),
        title: s.title,
        summary: s.summary,
        category: s.category,
        status: s.status,
        submitter_email: s.submitter_email,
        created_at: String(s.created_at),
      }))}
    />
  );
}
