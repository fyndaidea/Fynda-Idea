import "server-only";
import { getDb } from "@/lib/db";
import { ensureProfile } from "@/lib/db/profile";
import { isIdeaProgressStatus, type IdeaProgress, type IdeaProgressStatus } from "@/lib/ideas/progress";

export async function listIdeaProgress(userId: string, ideaId?: string): Promise<IdeaProgress[]> {
  let query = getDb().selectFrom("user_idea_progress as progress")
    .innerJoin("ideas", "ideas.id", "progress.idea_id")
    .select(["progress.idea_id", "progress.status", "progress.updated_at", "ideas.slug", "ideas.title", "ideas.summary"])
    .where("progress.user_id", "=", userId).where("ideas.status", "=", "published")
    .orderBy("progress.updated_at", "desc").orderBy("progress.idea_id", "asc");
  if (ideaId) query = query.where("progress.idea_id", "=", ideaId);
  const rows = await query.execute();
  return rows.flatMap((row) => isIdeaProgressStatus(row.status) ? [{
    ideaId: String(row.idea_id), slug: row.slug, title: row.title, summary: row.summary,
    status: row.status, updatedAt: new Date(row.updated_at).toISOString(),
  }] : []);
}

export async function saveIdeaProgress(userId: string, ideaId: string, status: IdeaProgressStatus | null) {
  if (status === null) {
    await getDb().deleteFrom("user_idea_progress").where("user_id", "=", userId).where("idea_id", "=", ideaId).execute();
    return;
  }
  await ensureProfile(userId);
  await getDb().insertInto("user_idea_progress").values({ user_id: userId, idea_id: ideaId, status, updated_at: new Date() })
    .onConflict((conflict) => conflict.columns(["user_id", "idea_id"]).doUpdateSet({ status, updated_at: new Date() })).execute();
}
