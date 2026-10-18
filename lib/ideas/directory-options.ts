import { isIdeaProgressStatus, type IdeaProgressStatus } from "./progress";

export const IDEA_SORTS = [
  { value: "updated", label: "Recently updated" },
  { value: "newest", label: "Newest added" },
  { value: "oldest", label: "Oldest added" },
  { value: "title", label: "Title A–Z" },
  { value: "score", label: "Highest score" },
] as const;
export type IdeaSort = (typeof IDEA_SORTS)[number]["value"];
export type DirectoryOptions = ReturnType<typeof parseDirectoryOptions>;
export function parseDirectoryOptions(params: URLSearchParams) {
  const sort = params.get("sort");
  const stage = params.get("stage");
  return {
    q: params.get("q") ?? "",
    page: Math.min(100000, Math.max(1, Math.floor(Number(params.get("page")) || 1))),
    sort: (IDEA_SORTS.some((s) => s.value === sort) ? sort : "updated") as IdeaSort,
    stage: (isIdeaProgressStatus(stage) || stage === "none" ? stage : "") as IdeaProgressStatus | "none" | "",
    saved: params.get("saved") === "1",
    featured: params.get("featured") === "1",
    view: params.get("view") === "list" ? "list" as const : "grid" as const,
  };
}
export function compareDirectoryIdeas(a: { id: string; title: string; score: number; updatedAt: Date | string; createdAt: Date | string }, b: typeof a, sort: IdeaSort) {
  let order = 0;
  if (sort === "score") order = b.score - a.score;
  if (sort === "title") order = a.title.toLowerCase() < b.title.toLowerCase() ? -1 : a.title.toLowerCase() > b.title.toLowerCase() ? 1 : 0;
  if (sort === "newest" || sort === "oldest") order = (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) * (sort === "oldest" ? -1 : 1);
  return order || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime() || a.id.localeCompare(b.id);
}
