import { createClient } from "@/lib/supabase/server";
import { getSupabaseAuthClient } from "@/lib/supabase/auth-client";

export type GetApiUserResult = { userId: string; email?: string } | null;

export async function getApiUser(request: Request): Promise<GetApiUserResult> {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) return null;
    try {
      const supabase = getSupabaseAuthClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);
      if (error || !user?.id) return null;
      return { userId: user.id, email: user.email ?? undefined };
    } catch {
      return null;
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return null;
  return { userId: user.id, email: user.email ?? undefined };
}

