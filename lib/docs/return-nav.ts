export const DOCS_FROM_ADMIN = "admin";

/** Append `?from=admin` so /docs can show an Admin back link. */
export function docsHref(path: string, fromAdmin = true): string {
  if (!fromAdmin) return path;
  const [pathname, search = ""] = path.split("?");
  const params = new URLSearchParams(search);
  params.set("from", DOCS_FROM_ADMIN);
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

export function isDocsFromAdmin(
  params: URLSearchParams | { get(name: string): string | null }
): boolean {
  return params.get("from") === DOCS_FROM_ADMIN;
}

export function adminBackHref(isAdmin: boolean | undefined): string {
  return isAdmin ? "/admin" : "/";
}
