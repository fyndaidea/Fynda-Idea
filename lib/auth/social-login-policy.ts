export const AUTH_SESSION_ERROR = "Your session could not be verified. Please sign in again.";

/**
 * Social (Google) and email sessions are allowed for every user.
 * The only check here: the verified JWT subject must match the verified user.
 * Admin access is enforced separately via the server-side profile role (requireAdmin, proxy).
 */
export function canUseVerifiedAuthSession(
  claims: { sub?: unknown },
  user: { id: string },
): boolean {
  return typeof claims.sub === "string" && claims.sub.length > 0 && claims.sub === user.id;
}
