import "server-only";

import { z } from "zod";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  getCategoryBySlug,
  listCategorySummaries,
  updateCategory,
} from "@/lib/db/categories-db";

function normalizeLookup(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function mcpListCategories(options?: { include_unpublished?: boolean }) {
  const rows = await listCategorySummaries({
    includeUnpublished: options?.include_unpublished === true,
  });
  return {
    categories: rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      slug: row.slug,
      description: row.description,
      published: row.published,
      sort_order: row.sort_order,
      idea_count: row.idea_count,
    })),
  };
}

export const mcpCreateCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  sort_order: z.number().int().optional(),
  upsert: z.boolean().optional(),
});

export async function mcpCreateCategory(input: z.infer<typeof mcpCreateCategorySchema>) {
  const name = input.name.trim();
  const upsert = input.upsert !== false;
  const all = await listCategorySummaries({ includeUnpublished: true });
  const match = all.find(
    (row) =>
      normalizeLookup(row.name) === normalizeLookup(name) ||
      (input.slug?.trim() && row.slug === input.slug.trim())
  );

  if (match) {
    if (!upsert) throw new Error(`Category "${match.name}" already exists`);
    const updated = await updateCategory(String(match.id), {
      name,
      description: input.description,
      published: input.published,
      sort_order: input.sort_order,
      slug: input.slug,
    });
    return {
      ok: true,
      created: false,
      existing: true,
      category: {
        id: String(updated?.id ?? match.id),
        slug: updated?.slug ?? match.slug,
        name: updated?.name ?? match.name,
        published: updated?.published ?? match.published,
      },
    };
  }

  const row = await createCategory({
    name,
    slug: input.slug,
    description: input.description,
    published: input.published ?? true,
    sort_order: input.sort_order,
  });
  return {
    ok: true,
    created: true,
    existing: false,
    category: {
      id: String(row.id),
      slug: row.slug,
      name: row.name,
      published: row.published,
    },
  };
}

export const mcpUpdateCategoryInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  published: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

export const mcpUpdateCategorySchema = mcpUpdateCategoryInputSchema.refine(
  (v) => Boolean(v.id?.trim() || v.slug?.trim()),
  { message: "Provide id or slug" }
);

export async function mcpUpdateCategory(input: z.infer<typeof mcpUpdateCategorySchema>) {
  let id = input.id?.trim();
  if (!id && input.slug?.trim()) {
    const row = await getCategoryBySlug(input.slug.trim(), { includeUnpublished: true });
    if (!row) throw new Error(`Category not found: ${input.slug}`);
    id = String(row.id);
  }
  if (!id) throw new Error("Provide id or slug");

  const updated = await updateCategory(id, {
    name: input.name,
    slug: input.slug,
    description: input.description,
    published: input.published,
    sort_order: input.sort_order,
  });
  if (!updated) throw new Error("Category not found");

  return {
    ok: true,
    category: {
      id: String(updated.id),
      slug: updated.slug,
      name: updated.name,
      description: updated.description,
      published: updated.published,
      sort_order: updated.sort_order,
    },
  };
}

export const mcpDeleteCategoryInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
});

export const mcpDeleteCategorySchema = mcpDeleteCategoryInputSchema.refine(
  (v) => Boolean(v.id?.trim() || v.slug?.trim()),
  { message: "Provide id or slug" }
);

export async function mcpDeleteCategory(input: z.infer<typeof mcpDeleteCategorySchema>) {
  let id = input.id?.trim();
  if (!id && input.slug?.trim()) {
    const row = await getCategoryBySlug(input.slug.trim(), { includeUnpublished: true });
    if (!row) throw new Error(`Category not found: ${input.slug}`);
    id = String(row.id);
  }
  if (!id) throw new Error("Provide id or slug");

  const existing = await getCategoryById(id);
  if (!existing) throw new Error("Category not found");

  await deleteCategory(id);
  return { ok: true, deleted_id: id, slug: existing.slug };
}
