import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { canUseVerifiedAuthSession } from "./social-login-policy";

/** Call after getUser verifies the identity. Applies to callbacks, cookies, and bearer tokens. */
export async function canUseAuthSession(
  supabase: SupabaseClient,
  user: User,
  accessToken?: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getClaims(accessToken);
    if (error || !data?.claims) return false;
    return canUseVerifiedAuthSession(data.claims, { id: user.id });
  } catch {
    return false;
  }
}
