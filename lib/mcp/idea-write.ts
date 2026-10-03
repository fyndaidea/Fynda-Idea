import "server-only";

import { z } from "zod";
import {
  createIdea,
  deleteIdea,
  getIdeaById,
  getIdeaBySlug,
  updateIdea,
  type IdeaStatus,
} from "@/lib/db/ideas-db";

export const mcpCreateIdeaSchema = z.object({
  title: z.string().min(1),
  slug: z.string().optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  score: z.number().int().min(0).max(100).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  author_name: z.string().nullable().optional(),
});

export async function mcpCreateIdea(input: z.infer<typeof mcpCreateIdeaSchema>) {
  const row = await createIdea({
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    body: input.body,
    status: (input.status ?? "draft") as IdeaStatus,
    featured: input.featured,
    score: input.score,
    category_ids: input.category_ids,
    tags: input.tags,
    highlights: input.highlights,
    author_name: input.author_name,
  });
  return {
    ok: true,
    idea: {
      id: String(row.id),
      slug: row.slug,
      title: row.title,
      status: row.status,
      featured: row.featured,
      score: row.score,
    },
  };
}

export const mcpUpdateIdeaInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  body: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  featured: z.boolean().optional(),
  score: z.number().int().min(0).max(100).optional(),
  category_ids: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
  highlights: z.array(z.string()).optional(),
  author_name: z.string().nullable().optional(),
});

export const mcpUpdateIdeaSchema = mcpUpdateIdeaInputSchema.refine(
  (v) => Boolean(v.id?.trim() || v.slug?.trim()),
  { message: "Provide id or slug" }
);

export async function mcpUpdateIdea(input: z.infer<typeof mcpUpdateIdeaSchema>) {
  let id = input.id?.trim();
  if (!id && input.slug?.trim()) {
    const existing = await getIdeaBySlug(input.slug.trim(), { includeDrafts: true });
    if (!existing) throw new Error(`Idea not found: ${input.slug}`);
    id = existing.id;
  }
  if (!id) throw new Error("Provide id or slug");

  const updated = await updateIdea(id, {
    title: input.title,
    slug: input.slug,
    summary: input.summary,
    body: input.body,
    status: input.status as IdeaStatus | undefined,
    featured: input.featured,
    score: input.score,
    category_ids: input.category_ids,
    tags: input.tags,
    highlights: input.highlights,
    author_name: input.author_name,
  });
  if (!updated) throw new Error("Idea not found");

  return {
    ok: true,
    idea: {
      id: String(updated.id),
      slug: updated.slug,
      title: updated.title,
      status: updated.status,
      featured: updated.featured,
      score: updated.score,
    },
  };
}

export const mcpDeleteIdeaInputSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().optional(),
});

export const mcpDeleteIdeaSchema = mcpDeleteIdeaInputSchema.refine(
  (v) => Boolean(v.id?.trim() || v.slug?.trim()),
  { message: "Provide id or slug" }
);

export async function mcpDeleteIdea(input: z.infer<typeof mcpDeleteIdeaSchema>) {
  let id = input.id?.trim();
  if (!id && input.slug?.trim()) {
    const existing = await getIdeaBySlug(input.slug.trim(), { includeDrafts: true });
    if (!existing) throw new Error(`Idea not found: ${input.slug}`);
    id = existing.id;
  }
  if (!id) throw new Error("Provide id or slug");

  const byId = await getIdeaById(id);
  if (!byId) throw new Error("Idea not found");

  await deleteIdea(id);
  return { ok: true, deleted_id: id, slug: byId.slug };
}
