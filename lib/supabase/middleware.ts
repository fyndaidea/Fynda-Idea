import { canUseAuthSession } from "@/lib/auth/social-login";
import { AUTH_SESSION_ERROR } from "@/lib/auth/social-login-policy";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseClientKey, getSupabaseUrl } from "./env";

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  user: User | null;
}> {
  let supabaseResponse = NextResponse.next({ request });
  const supabaseUrl = getSupabaseUrl();
  const supabaseClientKey = getSupabaseClientKey();
  if (!supabaseUrl || supabaseClientKey === "placeholder-key") {
    return { response: supabaseResponse, user: null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseClientKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verify the identity with Supabase Auth before the global admin gate trusts it.
  const { data: { user }, error } = await supabase.auth.getUser();
  if (user && !(await canUseAuthSession(supabase, user))) {
    await supabase.auth.signOut({ scope: "local" });
    const response = request.nextUrl.pathname.startsWith("/api/")
      ? NextResponse.json({ error: AUTH_SESSION_ERROR }, { status: 403 })
      : NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(AUTH_SESSION_ERROR)}`, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    response.headers.set("Cache-Control", "private, no-store");
    return { response, user: null };
  }
  return { response: supabaseResponse, user: error ? null : user };
}

