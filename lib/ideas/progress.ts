// Matches Idea Vault's Status schema (data source ed0807f3-3673-82d5-9589-07793eed341c), verified 2026-10-17.
export const IDEA_PROGRESS_GROUPS = [
  { name: "Review & selection", options: ["Raw", "To Review", "Under Review", "Reviewed", "Analyzed", "Potential", "🔥Ready for build"] },
  { name: "In progress", options: ["In Progress", "MVP / Build"] },
  { name: "Complete", options: ["Live / Launched", "Paused", "Killed", "Archived"] },
] as const;
export type IdeaProgressStatus = (typeof IDEA_PROGRESS_GROUPS)[number]["options"][number];
export const IDEA_PROGRESS_STATUSES = IDEA_PROGRESS_GROUPS.flatMap((group) => [...group.options]) as IdeaProgressStatus[];
export function isIdeaProgressStatus(value: unknown): value is IdeaProgressStatus {
  return typeof value === "string" && IDEA_PROGRESS_STATUSES.includes(value as IdeaProgressStatus);
}
export type IdeaProgress = {
  ideaId: string;
  slug: string;
  title: string;
  summary: string;
  status: IdeaProgressStatus;
  updatedAt: string;
};
