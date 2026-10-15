export const SOCIAL_LOGIN_ADMIN_ERROR = "Social login is available to existing administrators only. Please sign in with email.";

/** Presentation only: authorization always comes from a verified server-side role. */
export function isAdminLoginPath(path?: string | null): boolean {
  if (!path || !path.startsWith("/") || path.startsWith("//") || /[\\\x00-\x20]/.test(path)) return false;
  try {
    const url = new URL(path, "https://fynda.invalid");
    return url.origin === "https://fynda.invalid" && (url.pathname === "/admin" || url.pathname.startsWith("/admin/"));
  } catch {
    return false;
  }
}

/** Use verified AMR claims, not linked identities: a Google-linked account can use email. */
export function isSocialAuthSession(claims: { amr?: unknown }, provider?: unknown): boolean {
  if (Array.isArray(claims.amr) && claims.amr.length > 0) {
    return claims.amr.some((entry: unknown) => {
      if (!entry || typeof entry !== "object" || !("method" in entry)) return false;
      return entry.method === "oauth" || entry.method === "sso/saml";
    });
  }
  // Older tokens without AMR fail closed for accounts created through a social provider.
  return typeof provider === "string" && provider !== "email" && provider !== "phone";
}

export async function canUseVerifiedAuthSession(
  claims: { sub?: unknown; amr?: unknown },
  user: { id: string; app_metadata?: { provider?: unknown } },
  loadRole: (id: string) => Promise<string | null | undefined>,
): Promise<boolean> {
  if (claims.sub !== user.id) return false;
  if (!isSocialAuthSession(claims, user.app_metadata?.provider)) return true;
  try {
    return (await loadRole(user.id)) === "admin";
  } catch {
    return false;
  }
}
