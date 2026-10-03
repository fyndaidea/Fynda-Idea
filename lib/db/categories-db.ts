import { sql } from "kysely";
import { getDb } from "@/lib/db";
import { assertSlugAvailable } from "@/lib/db/slug-availability";
import { resolveSlug } from "@/lib/slugify";

export type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  published: boolean;
  created_at: Date;
  updated_at: Date;
};

export type CategorySummary = CategoryRow & {
  idea_count: number;
};

function categoryIdSqlMatch(categoryId: string) {
  return sql<boolean>`${categoryId}::uuid = ANY(category_ids)`;
}

export async function categoryNameMap(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const rows = await getDb()
    .selectFrom("categories")
    .select(["id", "name"])
    .where("id", "in", unique)
    .execute();
  return new Map(rows.map((row) => [String(row.id), row.name]));
}

export async function resolveCategoryLabels(ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const byId = await categoryNameMap(ids);
  return ids.map((id) => byId.get(id)).filter((name): name is string => Boolean(name));
}

/** Resolve category UUIDs from display names (e.g. submission intake). */
export async function resolveCategoryIdsFromNames(names: string[]): Promise<string[]> {
  if (!names.length) return [];
  const rows = await getDb()
    .selectFrom("categories")
    .select(["id", "name"])
    .where("name", "in", names)
    .execute();
  const byName = new Map(rows.map((row) => [row.name.toLowerCase(), String(row.id)]));
  return names
    .map((name) => byName.get(name.trim().toLowerCase()))
    .filter((id): id is string => Boolean(id));
}

export async function listCategories(options?: { includeUnpublished?: boolean }) {
  let q = getDb()
    .selectFrom("categories")
    .selectAll()
    .orderBy("sort_order", "asc")
    .orderBy("name", "asc");
  if (!options?.includeUnpublished) {
    q = q.where("published", "=", true);
  }
  return q.execute();
}

export async function getCategoryBySlug(slug: string, options?: { includeUnpublished?: boolean }) {
  let q = getDb().selectFrom("categories").selectAll().where("slug", "=", slug);
  if (!options?.includeUnpublished) {
    q = q.where("published", "=", true);
  }
  return q.executeTakeFirst();
}

export async function getCategoryById(id: string) {
  return getDb().selectFrom("categories").selectAll().where("id", "=", id).executeTakeFirst();
}

export async function countIdeasForCategory(categoryId: string) {
  const row = await getDb()
    .selectFrom("ideas")
    .select((eb) => eb.fn.countAll<number>().as("count"))
    .where(categoryIdSqlMatch(categoryId))
    .where("status", "=", "published")
    .executeTakeFirst();
  return Number(row?.count ?? 0);
}

export async function enrichCategorySummaries(rows: CategoryRow[]): Promise<CategorySummary[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      idea_count: await countIdeasForCategory(String(row.id)),
    }))
  );
}

export async function listCategorySummaries(options?: { includeUnpublished?: boolean; limit?: number }) {
  let q = getDb()
    .selectFrom("categories")
    .selectAll()
    .orderBy("sort_order", "asc")
    .orderBy("name", "asc");
  if (!options?.includeUnpublished) {
    q = q.where("published", "=", true);
  }
  if (options?.limit) q = q.limit(options.limit);
  const rows = await q.execute();
  return enrichCategorySummaries(rows);
}

export async function countCategories(options?: { includeUnpublished?: boolean }) {
  let q = getDb().selectFrom("categories").select((eb) => eb.fn.countAll<number>().as("count"));
  if (!options?.includeUnpublished) {
    q = q.where("published", "=", true);
  }
  const row = await q.executeTakeFirst();
  return Number(row?.count ?? 0);
}

export async function getCategoryWithIdeas(slug: string, options?: { includeUnpublished?: boolean }) {
  const category = await getCategoryBySlug(slug, options);
  if (!category) return null;

  const ideaRows = await getDb()
    .selectFrom("ideas")
    .selectAll()
    .where(categoryIdSqlMatch(String(category.id)))
    .where("status", "=", "published")
    .orderBy("score", "desc")
    .execute();

  const map = await categoryNameMap(
    ideaRows.flatMap((idea) => (Array.isArray(idea.category_ids) ? idea.category_ids.map(String) : []))
  );

  const ideas = ideaRows.map((idea) => ({
    slug: idea.slug,
    title: idea.title,
    summary: idea.summary,
    featured: Boolean(idea.featured),
    score: idea.score,
    categories: (idea.category_ids ?? [])
      .map((id) => map.get(String(id)))
      .filter((name): name is string => Boolean(name)),
    tags: idea.tags ?? [],
  }));

  return { category, ideas };
}

export async function createCategory(input: {
  name: string;
  slug?: string;
  description?: string;
  sort_order?: number;
  published?: boolean;
}) {
  const name = input.name.trim();
  const slug = resolveSlug(input.slug, name);
  await assertSlugAvailable("categories", slug);
  return getDb()
    .insertInto("categories")
    .values({
      name,
      slug,
      description: (input.description ?? "").trim(),
      sort_order: input.sort_order ?? 0,
      published: input.published ?? true,
      updated_at: new Date(),
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateCategory(
  id: string,
  input: Partial<{
    name: string;
    slug: string;
    description: string;
    sort_order: number;
    published: boolean;
  }>
) {
  const patch: Record<string, unknown> = { updated_at: new Date() };
  if (input.sort_order != null) patch.sort_order = input.sort_order;
  if (input.published != null) patch.published = input.published;
  if (input.description != null) patch.description = input.description.trim();

  if (input.slug != null || input.name != null) {
    const existing = await getCategoryById(id);
    if (!existing) return undefined;
    const name = (input.name != null ? input.name.trim() : existing.name) || existing.name;
    const slug = resolveSlug(input.slug ?? existing.slug, name);
    await assertSlugAvailable("categories", slug, id);
    patch.slug = slug;
    if (input.name != null) patch.name = name;
  }

  return getDb().updateTable("categories").set(patch).where("id", "=", id).returningAll().executeTakeFirst();
}

export async function deleteCategory(id: string) {
  return getDb().deleteFrom("categories").where("id", "=", id).executeTakeFirst();
}
