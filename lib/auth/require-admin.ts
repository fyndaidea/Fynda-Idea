import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getDb } from "@/lib/db";

/**
 * Server components (e.g. admin layout): require an authenticated admin user.
 * Mirrors the AI-Personal-Assistant pattern (requireUser + role enforcement server-side).
 */
export async function requireAdmin(): Promise<{ userId: string; isAdmin: boolean }> {
  if (!isSupabaseConfigured()) {
    redirect("/login?next=/admin&reason=configure");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect("/login?next=/admin");
  }

  const profile = await getDb()
    .selectFrom("profiles")
    .select(["role"])
    .where("id", "=", user.id)
    .executeTakeFirst();

  const isAdmin = Boolean(profile && profile.role === "admin");
  return { userId: user.id, isAdmin };
}

