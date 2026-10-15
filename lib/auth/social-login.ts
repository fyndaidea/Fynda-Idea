import "server-only";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { canUseVerifiedAuthSession } from "./social-login-policy";
import { getDb } from "@/lib/db";

/** Call after getUser verifies the identity. Applies to callbacks, cookies, and bearer tokens. */
export async function canUseAuthSession(
  supabase: SupabaseClient,
  user: User,
  accessToken?: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getClaims(accessToken);
    if (error || !data?.claims) return false;
    const verifiedUser = {
      id: user.id,
      app_metadata: { provider: data.claims.app_metadata?.provider },
    };
    return await canUseVerifiedAuthSession(data.claims, verifiedUser, async (id) => {
      const profile = await getDb()
        .selectFrom("profiles")
        .select("role")
        .where("id", "=", id)
        .executeTakeFirst();
      return profile?.role;
    });
  } catch {
    return false;
  }
}
