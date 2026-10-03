import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getProfileById } from "@/lib/db/profile";
import { createClient } from "@/lib/supabase/server";

/**
 * Server components: require a signed-in user.
 * @param nextPath — path to return to after login (e.g. `/dashboard`)
 */
export async function requireUser(nextPath = "/dashboard"): Promise<{
  userId: string;
  role: string;
}> {
  const safeNext = nextPath.startsWith("/") ? nextPath : "/dashboard";

  if (!isSupabaseConfigured()) {
    redirect(`/login?next=${encodeURIComponent(safeNext)}&reason=configure`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect(`/login?next=${encodeURIComponent(safeNext)}`);
  }

  const profile = await getProfileById(user.id);
  return { userId: user.id, role: profile?.role ?? "user" };
}
