/** URL-safe slug from a title or name. */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Prefer explicit slug; otherwise derive from source text (title/name). */
export function resolveSlug(explicitSlug: string | undefined, sourceText: string) {
  const slug = (explicitSlug?.trim() || slugify(sourceText)) || slugify(sourceText);
  if (!slug) throw new Error("Slug is required");
  return slug;
}
