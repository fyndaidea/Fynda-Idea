import { canUseAuthSession } from "@/lib/auth/social-login";
import { AUTH_SESSION_ERROR } from "@/lib/auth/social-login-policy";
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
  const recoveryFailure = nextRaw === "/reset-password"
    ? `${origin}/reset-password?error=invalid_reset_link` : null;

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?reason=configure`);
  }

  const tokenHash = searchParams.get("token_hash");
  const otpType = searchParams.get("type");
  if (!code && !tokenHash) {
    return NextResponse.redirect((recoveryFailure ?? (otpType === "recovery" ? `${origin}/reset-password?error=invalid_reset_link` : null)) ?? `${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const otpTypes = ["recovery", "signup", "magiclink", "invite", "email_change", "email"] as const;
  type OtpType = (typeof otpTypes)[number];
  const { data: exchanged, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : otpTypes.includes(otpType as OtpType)
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash as string, type: otpType as OtpType }).then((r) => ({ data: otpType === "recovery" ? { redirectType: "recovery" } : r.data, error: r.error }))
      : { data: null, error: { message: "Invalid link" } };
  if (error) {
    console.error("[auth/callback]", error.message);
    return NextResponse.redirect(
      recoveryFailure ?? `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(recoveryFailure ?? `${origin}/login?error=auth`);
  }

  if (!(await canUseAuthSession(supabase, user))) {
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(AUTH_SESSION_ERROR)}`);
  }

  try {
    await upsertProfileFromUser(user);
  } catch (e) {
    console.error("[auth/callback] profile sync", e);
  }

  // Recovery must reach the password form before normal admin/dashboard routing.
  if (nextRaw === "/reset-password" || (exchanged && "redirectType" in exchanged && exchanged.redirectType === "recovery")) {
    return NextResponse.redirect(`${origin}/reset-password`);
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
