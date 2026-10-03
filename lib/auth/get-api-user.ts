import { createClient } from "@/lib/supabase/server";
import { getSupabaseAuthClient } from "@/lib/supabase/auth-client";
import { isApiKeyToken, resolveApiKeyUser } from "@/lib/auth/resolve-api-key";

export type GetApiUserResult = { userId: string; email?: string } | null;

export async function getApiUser(request: Request): Promise<GetApiUserResult> {
  const apiKeyHeader = request.headers.get("X-API-Key")?.trim();
  if (apiKeyHeader && isApiKeyToken(apiKeyHeader)) {
    const resolved = await resolveApiKeyUser(apiKeyHeader);
    if (resolved) return { userId: resolved.userId };
  }

  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) return null;

    if (isApiKeyToken(token)) {
      const resolved = await resolveApiKeyUser(token);
      if (resolved) return { userId: resolved.userId };
      return null;
    }

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
