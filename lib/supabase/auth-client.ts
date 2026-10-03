import { createClient } from "@supabase/supabase-js";
import { getSupabaseClientKey, getSupabaseUrl } from "./env";

/**
 * Server-safe auth client used to validate bearer JWTs.
 * Uses the publishable/anon key.
 */
export function getSupabaseAuthClient() {
  const url = getSupabaseUrl();
  return createClient(url || "https://placeholder.supabase.co", getSupabaseClientKey());
}

