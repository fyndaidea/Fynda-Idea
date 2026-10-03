import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getVaultSecretByName } from "@/lib/vault/secrets";
import { getSupabaseUrl } from "./env";
import { SUPABASE_SECRET_VAULT_NAME } from "./secret-key";

export const STORAGE_NOT_CONFIGURED_MESSAGE =
  "File storage is not configured. Set SUPABASE_SECRET_KEY (or Vault supabase_secret_key) and ensure NEXT_PUBLIC_SUPABASE_URL is set.";

export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "documents";
}

async function resolveSecretKey(): Promise<string | null> {
  const fromEnv = process.env.SUPABASE_SECRET_KEY?.trim();
  if (fromEnv) return fromEnv;
  return getVaultSecretByName(SUPABASE_SECRET_VAULT_NAME);
}

/** Returns null if URL or secret key is missing (Storage uploads disabled). */
export async function getSupabaseServiceClient() {
  const url = getSupabaseUrl();
  const key = await resolveSecretKey();
  if (!url || !key || key === "placeholder-key") return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
