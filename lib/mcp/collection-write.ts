import "server-only";

import { z } from "zod";
import {
  createCollection,
  deleteCollection,
  getCollectionById,
  getCollectionBySlug,
  listCollectionSummaries,
  listIdeaSlugsForCollection,
  updateCollection,
} from "@/lib/db/collections-db";

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function mcpListCollections(options?: { include_unpublished?: boolean }) {
  const rows = await listCollectionSummaries({
    includeUnpublished: options?.include_unpublished === true,
  });
  return {
    collections: rows.map((row) => ({
      id: String(row.id),
      title: row.title,
      slug: row.slug,
      description: row.description,
      published: row.published,
      sort_order: row.sort_order,
      idea_count: row.idea_count,
    })),
  };
}

export const mcpCreateCollectionSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  idea_slugs: z.array(z.string().min(1)).optional(),
  upsert: z.boolean().optional(),
});

export async function mcpCreateCollection(input: z.infer<typeof mcpCreateCollectionSchema>) {
  const title = input.title.trim();
  const upsert = input.upsert !== false;
  const all = await listCollectionSummaries({ includeUnpublished: true });
  const match = all.find(
    (row) =>
      normalizeLookup(row.title) === normalizeLookup(title) ||
      (input.slug?.trim() && row.slug === input.slug.trim())
  );

  if (match) {
    if (!upsert) throw new Error(`Collection "${match.title}" already exists`);
    const updated = await updateCollection(String(match.id), {
      title,
      description: input.description,
      published: input.published,
      sort_order: input.sort_order,
      idea_slugs: input.idea_slugs,
      slug: input.slug,
    });
    return {
      ok: true,
      created: false,
      existing: true,
      collection: {
        id: String(updated?.id ?? match.id),
        slug: updated?.slug ?? match.slug,
        title: updated?.title ?? match.title,
        published: updated?.published ?? match.published,
        idea_count: input.idea_slugs?.length ?? match.idea_count,
      },
    };
  }

  const row = await createCollection({
    title,
    slug: input.slug,
    description: input.description,
    published: input.published ?? true,
    sort_order: input.sort_order,
    idea_slugs: input.idea_slugs,
  });
  return {
    ok: true,
    created: true,
    existing: false,
    collection: {
      id: String(row.id),
      slug: row.slug,
      title: row.title,
      published: row.published,
      idea_count: input.idea_slugs?.length ?? 0,
    },
  };
}

export const mcpUpdateCollectionInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  idea_slugs: z.array(z.string().min(1)).optional(),
});

export const mcpUpdateCollectionSchema = mcpUpdateCollectionInputSchema.refine(
  (v) => Boolean(v.id?.trim() || v.slug?.trim()),
  { message: "Provide id or slug" }
);

export async function mcpUpdateCollection(input: z.infer<typeof mcpUpdateCollectionSchema>) {
  let id = input.id?.trim();
  if (!id && input.slug?.trim()) {
    const row = await getCollectionBySlug(input.slug.trim(), { includeUnpublished: true });
    if (!row) throw new Error(`Collection not found: ${input.slug}`);
    id = String(row.id);
  }
  if (!id) throw new Error("Provide id or slug");

  const updated = await updateCollection(id, {
    title: input.title,
    slug: input.slug,
    description: input.description,
    published: input.published,
    sort_order: input.sort_order,
    idea_slugs: input.idea_slugs,
  });
  if (!updated) throw new Error("Collection not found");

  const ideaSlugs =
    input.idea_slugs ?? (await listIdeaSlugsForCollection(String(updated.id)));

  return {
    ok: true,
    collection: {
      id: String(updated.id),
      slug: updated.slug,
      title: updated.title,
      description: updated.description,
      published: updated.published,
      sort_order: updated.sort_order,
      idea_count: ideaSlugs.length,
      idea_slugs: ideaSlugs,
    },
  };
}

export const mcpDeleteCollectionInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
});

export const mcpDeleteCollectionSchema = mcpDeleteCollectionInputSchema.refine(
  (v) => Boolean(v.id?.trim() || v.slug?.trim()),
  { message: "Provide id or slug" }
);

export async function mcpDeleteCollection(input: z.infer<typeof mcpDeleteCollectionSchema>) {
  let id = input.id?.trim();
  if (!id && input.slug?.trim()) {
    const row = await getCollectionBySlug(input.slug.trim(), { includeUnpublished: true });
    if (!row) throw new Error(`Collection not found: ${input.slug}`);
    id = String(row.id);
  }
  if (!id) throw new Error("Provide id or slug");

  const existing = await getCollectionById(id);
  if (!existing) throw new Error("Collection not found");

  await deleteCollection(id);
  return { ok: true, deleted_id: id, slug: existing.slug };
}
