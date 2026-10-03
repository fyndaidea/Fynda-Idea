import { NextResponse } from "next/server";
import { resolvePostAuthRedirect } from "@/lib/auth/resolve-post-auth-redirect";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";
import { isAdminRole } from "@/lib/auth/roles";
import { upsertProfileFromUser } from "@/lib/auth/sync-profile";
import { getProfileById } from "@/lib/db/profile";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Exchanges Supabase PKCE `code` from email confirmation, magic link, password recovery, and OAuth.
 * Add this URL to Supabase → Authentication → URL configuration → Redirect URLs.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next");

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?reason=configure`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("[auth/callback]", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    await upsertProfileFromUser(user);
  } catch (e) {
    console.error("[auth/callback] profile sync", e);
  }

  let role: string | null = null;
  try {
    const profile = await getProfileById(user.id);
    role = profile?.role ?? null;
  } catch {
    /* ignore */
  }

  const next = isAdminRole(role)
    ? resolvePostLoginPath({ nextPath: nextRaw, role })
    : await resolvePostAuthRedirect(user.id, nextRaw);
  return NextResponse.redirect(`${origin}${next}`);
}
