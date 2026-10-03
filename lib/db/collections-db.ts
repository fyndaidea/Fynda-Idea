import { getDb } from "@/lib/db";
import { categoryNameMap } from "@/lib/db/categories-db";
import { assertSlugAvailable } from "@/lib/db/slug-availability";
import { resolveSlug } from "@/lib/slugify";

export type CollectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  published: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
};

export type CollectionSummary = CollectionRow & {
  idea_count: number;
};

export async function listCollections(options?: { includeUnpublished?: boolean }) {
  let q = getDb()
    .selectFrom("collections")
    .selectAll()
    .orderBy("sort_order", "asc")
    .orderBy("updated_at", "desc");
  if (!options?.includeUnpublished) {
    q = q.where("published", "=", true);
  }
  return q.execute();
}

export async function countCollections(options?: { includeUnpublished?: boolean }) {
  let q = getDb().selectFrom("collections").select((eb) => eb.fn.countAll<number>().as("count"));
  if (!options?.includeUnpublished) {
    q = q.where("published", "=", true);
  }
  const row = await q.executeTakeFirst();
  return Number(row?.count ?? 0);
}

export async function getCollectionById(id: string) {
  return getDb().selectFrom("collections").selectAll().where("id", "=", id).executeTakeFirst();
}

export async function getCollectionBySlug(slug: string, options?: { includeUnpublished?: boolean }) {
  let q = getDb().selectFrom("collections").selectAll().where("slug", "=", slug);
  if (!options?.includeUnpublished) {
    q = q.where("published", "=", true);
  }
  return q.executeTakeFirst();
}

export async function listIdeaSlugsForCollection(collectionId: string) {
  const rows = await getDb()
    .selectFrom("collection_ideas")
    .select(["idea_slug", "sort_order"])
    .where("collection_id", "=", collectionId)
    .orderBy("sort_order", "asc")
    .execute();
  return rows.map((r) => r.idea_slug);
}

export async function enrichCollectionSummaries(rows: CollectionRow[]): Promise<CollectionSummary[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const counts = await getDb()
    .selectFrom("collection_ideas")
    .select(["collection_id", (eb) => eb.fn.countAll<number>().as("count")])
    .where("collection_id", "in", ids)
    .groupBy("collection_id")
    .execute();
  const countById = new Map(counts.map((c) => [c.collection_id, Number(c.count)]));

  return rows.map((row) => ({
    ...row,
    idea_count: countById.get(row.id) ?? 0,
  }));
}

export async function listCollectionSummaries(options?: { includeUnpublished?: boolean; limit?: number }) {
  let q = getDb()
    .selectFrom("collections")
    .selectAll()
    .orderBy("sort_order", "asc")
    .orderBy("updated_at", "desc");
  if (!options?.includeUnpublished) {
    q = q.where("published", "=", true);
  }
  if (options?.limit) q = q.limit(options.limit);
  const rows = await q.execute();
  return enrichCollectionSummaries(rows);
}

export async function getCollectionWithIdeas(slug: string, options?: { includeUnpublished?: boolean }) {
  const collection = await getCollectionBySlug(slug, options);
  if (!collection) return null;

  const ideaSlugs = await listIdeaSlugsForCollection(collection.id);
  if (!ideaSlugs.length) {
    return { collection, ideas: [] as Array<{
      slug: string;
      title: string;
      summary: string;
      featured: boolean;
      score: number;
      categories: string[];
      tags: string[];
    }> };
  }

  const ideaRows = await getDb()
    .selectFrom("ideas")
    .selectAll()
    .where("slug", "in", ideaSlugs)
    .where("status", "=", "published")
    .execute();
  const bySlug = new Map(ideaRows.map((t) => [t.slug, t]));
  const categoryMap = await categoryNameMap(
    ideaRows.flatMap((idea) => (idea.category_ids ?? []).map(String).filter(Boolean))
  );

  const ideas = ideaSlugs.flatMap((s) => {
    const idea = bySlug.get(s);
    if (!idea) return [];
    return [{
      slug: idea.slug,
      title: idea.title,
      summary: idea.summary,
      featured: Boolean(idea.featured),
      score: idea.score,
      categories: (idea.category_ids ?? [])
        .map((id) => categoryMap.get(String(id)))
        .filter((name): name is string => Boolean(name)),
      tags: idea.tags ?? [],
    }];
  });

  return { collection, ideas };
}

export async function createCollection(input: {
  title: string;
  slug?: string;
  description?: string;
  published?: boolean;
  sort_order?: number;
  idea_slugs?: string[];
}) {
  const title = input.title.trim();
  const slug = resolveSlug(input.slug, title);
  await assertSlugAvailable("collections", slug);
  const now = new Date();
  const collection = await getDb()
    .insertInto("collections")
    .values({
      title,
      slug,
      description: (input.description ?? "").trim(),
      published: input.published ?? false,
      sort_order: input.sort_order ?? 0,
      created_at: now,
      updated_at: now,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  if (input.idea_slugs?.length) {
    await setCollectionIdeas(collection.id, input.idea_slugs);
  }
  return collection;
}

export async function updateCollection(
  id: string,
  input: Partial<{
    title: string;
    slug: string;
    description: string;
    published: boolean;
    sort_order: number;
    idea_slugs: string[];
  }>
) {
  const patch: Record<string, unknown> = { updated_at: new Date() };
  if (input.description != null) patch.description = input.description.trim();
  if (input.published != null) patch.published = input.published;
  if (input.sort_order != null) patch.sort_order = input.sort_order;

  if (input.slug != null || input.title != null) {
    const existing = await getCollectionById(id);
    if (!existing) return undefined;
    const title = (input.title != null ? input.title.trim() : existing.title) || existing.title;
    const slug = resolveSlug(input.slug ?? existing.slug, title);
    await assertSlugAvailable("collections", slug, id);
    patch.slug = slug;
    if (input.title != null) patch.title = title;
  }

  const updated = await getDb()
    .updateTable("collections")
    .set(patch)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();

  if (input.idea_slugs != null) {
    await setCollectionIdeas(id, input.idea_slugs);
  }

  return updated;
}

export async function setCollectionIdeas(collectionId: string, ideaSlugs: string[]) {
  await getDb().deleteFrom("collection_ideas").where("collection_id", "=", collectionId).execute();
  if (!ideaSlugs.length) return;
  await getDb()
    .insertInto("collection_ideas")
    .values(
      ideaSlugs.map((idea_slug, sort_order) => ({
        collection_id: collectionId,
        idea_slug,
        sort_order,
      }))
    )
    .execute();
}

export async function deleteCollection(id: string) {
  return getDb().deleteFrom("collections").where("id", "=", id).executeTakeFirst();
}
