import "server-only";

import { getDb } from "@/lib/db";
import { SlugConflictError } from "@/lib/db/slug-errors";

type SlugTable = "collections" | "categories" | "ideas";

export async function assertSlugAvailable(table: SlugTable, slug: string, excludeId?: string) {
  const trimmed = slug.trim();
  if (!trimmed) throw new Error("Slug is required");

  let q = getDb().selectFrom(table).select("id").where("slug", "=", trimmed);
  if (excludeId) q = q.where("id", "!=", excludeId);

  const existing = await q.executeTakeFirst();
  if (existing) throw new SlugConflictError(trimmed);
}
