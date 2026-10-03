import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseClientKey, getSupabaseUrl } from "./env";

// Match reference project export name/behavior.
export function createClient() {
  const supabaseUrl = getSupabaseUrl() || "https://placeholder.supabase.co";
  return createBrowserClient(supabaseUrl, getSupabaseClientKey());
}

