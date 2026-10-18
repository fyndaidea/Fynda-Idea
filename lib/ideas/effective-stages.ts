import "server-only";
import { randomUUID } from "node:crypto";
import { getProfileById } from "@/lib/db/profile";
import { listIdeaProgress } from "@/lib/db/idea-progress-db";
import { readIdeaNotionStages } from "./notion-stages";
import type { IdeaProgressStatus } from "./progress";

export type StageSnapshot = { revision: string; scope: "notion" | "personal"; statuses: Record<string, IdeaProgressStatus | null>; errors: Record<string, string> };
const defaults = {
  roleForUser: async (userId: string) => (await getProfileById(userId))?.role,
  personal: listIdeaProgress,
  notion: readIdeaNotionStages,
};
export async function effectiveIdeaStages(userId: string, ideas: { id: string; slug: string; body: string }[], dependencies = defaults): Promise<StageSnapshot> {
  if (await dependencies.roleForUser(userId) === "admin") return { revision: randomUUID(), scope: "notion", ...await dependencies.notion(ideas) };
  const personal = await dependencies.personal(userId);
  return { revision: randomUUID(), scope: "personal", statuses: Object.fromEntries(ideas.map(idea => [idea.id, personal.find(p => p.ideaId === idea.id)?.status ?? null])), errors: {} };
}
