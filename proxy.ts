import { NextResponse, type NextRequest } from "next/server";
import { resolvePostLoginPath } from "@/lib/auth/post-login-path";
import { getProfileById } from "@/lib/db/profile";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/middleware";

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((c) => {
    to.cookies.set(c.name, c.value);
  });
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path.startsWith("/admin") && !isSupabaseConfigured()) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    url.searchParams.set("reason", "configure");
    return NextResponse.redirect(url);
  }

  const { response, user } = await updateSession(request);

  if (!isSupabaseConfigured()) {
    return response;
  }

  const isAdminArea = path.startsWith("/admin");
  const isDashboard = path === "/dashboard" || path.startsWith("/dashboard/");
  const isAuthRoute = path === "/login" || path === "/register";

  if ((isAdminArea || isDashboard) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    const redirectResponse = NextResponse.redirect(url);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (isAuthRoute && user) {
    const nextParam = request.nextUrl.searchParams.get("next");
    let role: string | null = null;
    try {
      const profile = await getProfileById(user.id);
      role = profile?.role ?? null;
    } catch {
      /* use default redirect */
    }
    const dest = resolvePostLoginPath({ nextPath: nextParam, role });
    const redirectResponse = NextResponse.redirect(new URL(dest, request.url));
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    // Skip API routes and /auth/* (OAuth callback at /auth/callback).
    "/((?!_next/static|_next/image|favicon.ico|api/|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
