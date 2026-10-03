export function slugToHref(realm: "user" | "admin", slug: string): string {
  if (realm === "admin") {
    return slug ? `/docs/admin/${slug}` : "/docs/admin";
  }
  return slug ? `/docs/${slug}` : "/docs";
}
