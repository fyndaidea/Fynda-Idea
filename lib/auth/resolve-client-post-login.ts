import { resolvePostLoginPath } from "@/lib/auth/post-login-path";

/** Client-side post-login redirect (no subscription billing). */
export async function resolveClientPostLoginPath(options: {
  nextPath?: string | null;
  role?: string | null;
}): Promise<string> {
  const next = options.nextPath?.trim();
  if (next?.startsWith("/") && !next.includes("tab=billing")) {
    return resolvePostLoginPath(options);
  }
  return "/dashboard";
}
