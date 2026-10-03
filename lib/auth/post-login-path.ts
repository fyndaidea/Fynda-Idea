const AUTH_ROUTES = new Set(["/login", "/register", "/forgot-password", "/reset-password"]);

/** Where to send the user after sign-in (respects explicit `next` when safe). */
export function resolvePostLoginPath(options: {
  nextPath?: string | null;
  role?: string | null;
}): string {
  const next = options.nextPath?.trim();
  if (next && next.startsWith("/") && !AUTH_ROUTES.has(next.split("?")[0] ?? next)) {
    return next;
  }
  if (options.role === "admin") return "/admin";
  return "/dashboard";
}
