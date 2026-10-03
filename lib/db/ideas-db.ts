import { sql } from "kysely";
import { getDb } from "@/lib/db";
import { categoryNameMap } from "@/lib/db/categories-db";
import { assertSlugAvailable } from "@/lib/db/slug-availability";
import { resolveSlug } from "@/lib/slugify";

export type IdeaStatus = "draft" | "published";

export type IdeaRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: string;
  featured: boolean;
  score: number;
  category_ids: string[] | null;
  tags: string[] | null;
  highlights: string[] | null;
  author_name: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Idea = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  status: IdeaStatus;
  featured: boolean;
  score: number;
  categoryIds: string[];
  categories: string[];
  tags: string[];
  highlights: string[];
  authorName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const ideaSelect = [
  "id",
  "title",
  "slug",
  "summary",
  "body",
  "status",
  "featured",
  "score",
  "category_ids",
  "tags",
  "highlights",
  "author_name",
  "created_at",
  "updated_at",
] as const;

export function rowToIdea(row: IdeaRow, categoryMap?: Map<string, string>): Idea {
  const categoryIds = (row.category_ids ?? []).map(String).filter(Boolean);
  const categories = categoryMap
    ? categoryIds.map((id) => categoryMap.get(id)).filter((n): n is string => Boolean(n))
    : [];
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    summary: row.summary ?? "",
    body: row.body ?? "",
    status: (row.status === "published" ? "published" : "draft") as IdeaStatus,
    featured: Boolean(row.featured),
    score: row.score ?? 50,
    categoryIds,
    categories,
    tags: row.tags ?? [],
    highlights: row.highlights ?? [],
    authorName: row.author_name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function rowsToIdeas(rows: IdeaRow[]): Promise<Idea[]> {
  const map = await categoryNameMap(
    rows.flatMap((row) => (row.category_ids ?? []).map(String).filter(Boolean))
  );
  return rows.map((row) => rowToIdea(row, map));
}

export async function listIdeas(options?: {
  limit?: number;
  offset?: number;
  featuredOnly?: boolean;
  includeDrafts?: boolean;
  categoryId?: string;
  tag?: string;
  search?: string;
}) {
  const limit = options?.limit ?? 100;
  const offset = options?.offset ?? 0;
  let q = getDb()
    .selectFrom("ideas")
    .select(ideaSelect)
    .orderBy("score", "desc")
    .orderBy("updated_at", "desc")
    .limit(limit)
    .offset(offset);

  if (!options?.includeDrafts) {
    q = q.where("status", "=", "published");
  }
  if (options?.featuredOnly) {
    q = q.where("featured", "=", true);
  }
  if (options?.categoryId) {
    q = q.where(sql<boolean>`${options.categoryId}::uuid = ANY(category_ids)`);
  }
  if (options?.tag) {
    q = q.where(sql<boolean>`${options.tag} = ANY(tags)`);
  }
  if (options?.search?.trim()) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    q = q.where(
      sql<boolean>`(
        lower(title) like ${term}
        or lower(summary) like ${term}
        or lower(body) like ${term}
      )`
    );
  }

  const rows = await q.execute();
  return rowsToIdeas(rows);
}

export async function getIdeaBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<Idea | null> {
  let q = getDb().selectFrom("ideas").select(ideaSelect).where("slug", "=", slug);
  if (!options?.includeDrafts) {
    q = q.where("status", "=", "published");
  }
  const row = await q.executeTakeFirst();
  if (!row) return null;
  const map = await categoryNameMap((row.category_ids ?? []).map(String).filter(Boolean));
  return rowToIdea(row, map);
}

export async function getIdeaById(id: string): Promise<Idea | null> {
  const row = await getDb().selectFrom("ideas").select(ideaSelect).where("id", "=", id).executeTakeFirst();
  if (!row) return null;
  const map = await categoryNameMap((row.category_ids ?? []).map(String).filter(Boolean));
  return rowToIdea(row, map);
}

export async function countIdeas(options?: {
  includeDrafts?: boolean;
  featuredOnly?: boolean;
  categoryId?: string;
  search?: string;
}) {
  let q = getDb().selectFrom("ideas").select(({ fn }) => fn.countAll<number>().as("c"));
  if (!options?.includeDrafts) {
    q = q.where("status", "=", "published");
  }
  if (options?.featuredOnly) {
    q = q.where("featured", "=", true);
  }
  if (options?.categoryId) {
    q = q.where(sql<boolean>`${options.categoryId}::uuid = ANY(category_ids)`);
  }
  if (options?.search?.trim()) {
    const term = `%${options.search.trim().toLowerCase()}%`;
    q = q.where(
      sql<boolean>`(
        lower(title) like ${term}
        or lower(summary) like ${term}
        or lower(body) like ${term}
      )`
    );
  }
  const row = await q.executeTakeFirst();
  return Number(row?.c ?? 0);
}

export async function searchIdeas(query: string, options?: { limit?: number }) {
  return listIdeas({ search: query, limit: options?.limit ?? 20 });
}

export async function createIdea(input: {
  title: string;
  slug?: string;
  summary?: string;
  body?: string;
  status?: IdeaStatus;
  featured?: boolean;
  score?: number;
  category_ids?: string[];
  tags?: string[];
  highlights?: string[];
  author_name?: string | null;
}) {
  const title = input.title.trim();
  const slug = resolveSlug(input.slug, title);
  await assertSlugAvailable("ideas", slug);
  const now = new Date();
  return getDb()
    .insertInto("ideas")
    .values({
      title,
      slug,
      summary: (input.summary ?? "").trim(),
      body: (input.body ?? "").trim(),
      status: input.status ?? "draft",
      featured: input.featured ?? false,
      score: input.score ?? 50,
      category_ids: input.category_ids ?? [],
      tags: input.tags ?? [],
      highlights: input.highlights ?? [],
      author_name: input.author_name?.trim() || null,
      created_at: now,
      updated_at: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateIdea(
  id: string,
  input: Partial<{
    title: string;
    slug: string;
    summary: string;
    body: string;
    status: IdeaStatus;
    featured: boolean;
    score: number;
    category_ids: string[];
    tags: string[];
    highlights: string[];
    author_name: string | null;
  }>
) {
  const patch: Record<string, unknown> = { updated_at: new Date() };

  if (input.summary != null) patch.summary = input.summary.trim();
  if (input.body != null) patch.body = input.body.trim();
  if (input.status != null) patch.status = input.status;
  if (input.featured != null) patch.featured = input.featured;
  if (input.score != null) patch.score = input.score;
  if (input.category_ids != null) patch.category_ids = input.category_ids;
  if (input.tags != null) patch.tags = input.tags;
  if (input.highlights != null) patch.highlights = input.highlights;
  if (input.author_name !== undefined) patch.author_name = input.author_name?.trim() || null;

  if (input.slug != null || input.title != null) {
    const existing = await getDb().selectFrom("ideas").selectAll().where("id", "=", id).executeTakeFirst();
    if (!existing) return undefined;
    const title = (input.title != null ? input.title.trim() : existing.title) || existing.title;
    const slug = resolveSlug(input.slug ?? existing.slug, title);
    await assertSlugAvailable("ideas", slug, id);
    patch.slug = slug;
    if (input.title != null) patch.title = title;
  }

  return getDb().updateTable("ideas").set(patch).where("id", "=", id).returningAll().executeTakeFirst();
}

export async function deleteIdea(id: string) {
  return getDb().deleteFrom("ideas").where("id", "=", id).executeTakeFirst();
}
