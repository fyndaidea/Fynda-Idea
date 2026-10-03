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

  // Use getSession() here, not getUser(). getUser() validates with Supabase Auth over the
  // network on every request and can hit 10s connect timeouts (undici) under load or slow
  // networks — blocking proxy.ts for the whole route. Session is read from cookies; admin
  // routes still enforce access in server components / API handlers.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  return { response: supabaseResponse, user };
}

