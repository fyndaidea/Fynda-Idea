import "server-only";

import { getProfileById } from "@/lib/db/profile";
import { saveIdeaProgress } from "@/lib/db/idea-progress-db";
import { NotionStatusError, syncIdeaNotionStatus } from "./notion-status";
import type { IdeaProgressStatus } from "./progress";

type IdeaTarget = { id: string; slug: string; body: string };
const defaults = {
  roleForUser: async (userId: string) => (await getProfileById(userId))?.role,
  sync: syncIdeaNotionStatus,
  save: saveIdeaProgress,
};

/** Identity comes from verified authentication; role always comes from the database. */
export async function saveIdeaStageForUser(userId: string, idea: IdeaTarget, status: IdeaProgressStatus | null, dependencies: typeof defaults = defaults) {
  const role = await dependencies.roleForUser(userId);
  const syncToNotion = role === "admin" && status !== null;
  if (syncToNotion) await dependencies.sync(idea, status);
  try { await dependencies.save(userId, idea.id, status); }
  catch (error) {
    if (syncToNotion) throw new NotionStatusError("Notion was updated, but your tracker could not be saved. Try again.", 500);
    throw error;
  }
  return { status, notionSynced: syncToNotion };
}
