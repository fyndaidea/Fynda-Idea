import "server-only";

/** After OAuth, email confirm, or magic link — no subscription billing redirect. */
export async function resolvePostAuthRedirect(
  _userId: string,
  next: string | null
): Promise<string> {
  const safeNext = next?.startsWith("/") ? next : "/dashboard";
  if (safeNext.includes("tab=billing") || safeNext.includes("group=settings&tab=billing")) {
    return "/dashboard";
  }
  return safeNext;
}
