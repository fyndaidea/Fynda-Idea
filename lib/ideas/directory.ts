import "server-only";
import { listIdeas, countIdeas } from "@/lib/db/ideas-db";
import { getProfileFavorites } from "@/lib/favorites/store";
import { getProfileById } from "@/lib/db/profile";
import { listIdeaProgress } from "@/lib/db/idea-progress-db";
import { notionSlugsAtStage } from "./notion-stages";
import { effectiveIdeaStages, type StageSnapshot } from "./effective-stages";
import type { DirectoryOptions } from "./directory-options";

export async function ideasDirectory(options: DirectoryOptions, userId?: string, pageSize = 24) {
  const favorites = userId ? (await getProfileFavorites(userId)).idea.map(item => item.id) : [];
  let includeSlugs: string[] | undefined = options.saved ? favorites : undefined;
  let excludeSlugs: string[] | undefined;
  if (options.stage) {
    let matches: string[];
    if (userId && (await getProfileById(userId))?.role === "admin") matches = await notionSlugsAtStage(options.stage);
    else {
      const progress = userId ? await listIdeaProgress(userId) : [];
      matches = progress.filter(p => options.stage === "none" || p.status === options.stage).map(p => p.slug);
      if (options.stage === "none") excludeSlugs = matches;
    }
    if (!excludeSlugs) includeSlugs = includeSlugs ? includeSlugs.filter(slug => matches.includes(slug)) : matches;
  }
  const filters = { search: options.q || undefined, featuredOnly: options.featured, includeSlugs, excludeSlugs };
  const total = await countIdeas(filters);
  const page = Math.min(options.page, Math.max(1, Math.ceil(total / pageSize)));
  const ideas = await listIdeas({ ...filters, limit: pageSize, offset: (page - 1) * pageSize, favoriteSlugs: favorites, sortBy: options.sort });
  let stages: StageSnapshot | undefined;
  let stageError: string | undefined;
  if (userId) {
    try { stages = await effectiveIdeaStages(userId, ideas); }
    catch { stageError = "Could not load idea statuses. Use the status control to retry."; }
  }
  return { ideas, total, page, pageSize, favorites, userId: userId ?? null, stages, stageError };
}
