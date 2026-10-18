import { z } from "zod";
const revision = z.number().int().nonnegative();
export const ideaSectionEditSchema = z.discriminatedUnion("section", [
  z.object({ section: z.literal("overview"), revision, title: z.string().trim().min(1).max(500), summary: z.string().max(10000) }).strict(),
  z.object({ section: z.literal("highlights"), revision, highlights: z.array(z.string().trim().min(1).max(2000)).max(100) }).strict(),
  z.object({ section: z.literal("metadata"), revision, author_name: z.string().max(500).nullable(), tags: z.array(z.string().trim().min(1).max(200)).max(100), category_ids: z.array(z.string().uuid()).max(100) }).strict(),
  z.object({ section: z.literal("body"), revision, body: z.string().max(1000000) }).strict(),
]);
export type IdeaSectionEdit = z.infer<typeof ideaSectionEditSchema>;
