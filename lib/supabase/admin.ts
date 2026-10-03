/**
 * Server-only Supabase client for elevated access (bypass RLS, admin operations).
 * Use only in server routes. Never expose this client or the key to the browser.
 *
 * The secret key is loaded from `SUPABASE_SECRET_KEY` or Supabase Vault (see `resolveSupabaseSecretKey`).
 */
import { createClient } from "@supabase/supabase-js";
import { getSupabaseUrl } from "./env";
import { resolveSupabaseSecretKey } from "./secret-key";

export async function getAdminClient() {
  const url = getSupabaseUrl();
  if (!url) {
    throw new Error("Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL");
  }
  const secretKey = await resolveSupabaseSecretKey();
  return createClient(url, secretKey);
}

