import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseClientKey, getSupabaseUrl } from "./env";

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = getSupabaseUrl() || "https://placeholder.supabase.co";
  return createServerClient(supabaseUrl, getSupabaseClientKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      },
    },
  });
}

