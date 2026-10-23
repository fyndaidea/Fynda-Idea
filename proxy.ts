import { isCaptchaPublicPath } from "@/lib/auth/auth-captcha";
import { isStorePublicPath } from "@/lib/store/access";
import { NextResponse, type NextRequest } from "next/server";
import { getProfileById } from "@/lib/db/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseAuthClient } from "@/lib/supabase/auth-client";
import { updateSession } from "@/lib/supabase/middleware";
import { isApiKeyToken, resolveApiKeyUser } from "@/lib/auth/resolve-api-key";
import { ADMIN_GATE_HEADERS, getCookingHtml, isAdminGatePublicPath, isGateAdmin } from "@/lib/access/admin-only";

function restrict(request: NextRequest, sessionResponse?: NextResponse, signedIn = false) {
  const response = request.nextUrl.pathname.startsWith("/api/")
    ? NextResponse.json({ error: "Something is cooking. Admin access only." }, { status: 403, headers: ADMIN_GATE_HEADERS })
    : new NextResponse(getCookingHtml(signedIn), {
        status: 503,
        headers: { ...ADMIN_GATE_HEADERS, "Content-Type": "text/html; charset=utf-8", "Retry-After": "3600" },
      });
  sessionResponse?.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function proxy(request: NextRequest) {
  if (isCaptchaPublicPath(request.nextUrl.pathname, request.method)) return NextResponse.next();
  if (isStorePublicPath(request.nextUrl.pathname, request.method)) {
    if (!isSupabaseConfigured()) return NextResponse.next();
    return (await updateSession(request)).response;
  }
  const path = request.nextUrl.pathname;
  // These protocol handlers validate token owners and admin roles themselves.
  if (/^\/api\/mcp\/[^/]+$/.test(path) || path === "/api/mcp/oauth/token" || path === "/api/mcp/oauth/register") return NextResponse.next();
  if (isAdminGatePublicPath(path, request.method)) return NextResponse.next();
  // Supabase sends auth links to the Site URL when redirectTo isn't allow-listed; never show the gate for them.
  const authParams = request.nextUrl.searchParams;
  if (request.method === "GET" && !request.nextUrl.pathname.startsWith("/api/") && request.nextUrl.pathname !== "/auth/callback" && (authParams.has("code") || (authParams.has("token_hash") && authParams.has("type")))) {
    const callback = new URL("/auth/callback", request.url);
    authParams.forEach((value, key) => callback.searchParams.set(key, value));
    if (!callback.searchParams.has("next") && authParams.get("type") === "recovery") callback.searchParams.set("next", "/reset-password");
    return NextResponse.redirect(callback);
  }
  // A deployment without auth configuration remains closed to the public.
  if (!isSupabaseConfigured()) return restrict(request);

  const { response, user } = await updateSession(request);
  let userId = user?.id;
  // API clients must prove their identity as well; bearer credentials take precedence.
  const authorization = request.headers.get("Authorization");
  if (authorization) {
    userId = undefined;
    if (authorization.startsWith("Bearer ")) {
      const token = authorization.slice(7).trim();
      if (isApiKeyToken(token)) {
        userId = (await resolveApiKeyUser(token))?.userId;
      } else if (token) {
        const { data, error } = await getSupabaseAuthClient().auth.getUser(token);
        if (!error) userId = data.user?.id;
      }
    }
  }
  if (!userId) return restrict(request, response, Boolean(user));
  const profile = await getProfileById(userId);
  if (!isGateAdmin(profile?.role)) return restrict(request, response, Boolean(user));

  Object.entries(ADMIN_GATE_HEADERS).forEach(([name, value]) => response.headers.set(name, value));
  return response;
}

// Includes APIs, metadata, optimized images and public files; no extension-based bypass.
export const config = { matcher: ["/((?!_next/static/|_next/webpack-hmr).*)"] };
