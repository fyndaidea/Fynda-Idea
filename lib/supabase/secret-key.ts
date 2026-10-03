import "server-only";

import { getVaultSecretByName } from "@/lib/vault/secrets";

/** Vault secret `name` for the Supabase server (service role) key — must match Dashboard / SQL. */
export const SUPABASE_SECRET_VAULT_NAME = "supabase_secret_key";

/**
 * Loads the Supabase server secret key (service role / secret key).
 * Prefers `SUPABASE_SECRET_KEY` in `.env` for local dev, then Supabase Vault
 * (`supabase_secret_key`) for production.
 */
export async function resolveSupabaseSecretKey(): Promise<string> {
  const fromEnv = process.env.SUPABASE_SECRET_KEY?.trim();
  if (fromEnv) return fromEnv;

  const value = await getVaultSecretByName(SUPABASE_SECRET_VAULT_NAME);
  const trimmed = value?.trim();
  if (trimmed) return trimmed;

  throw new Error(
    `Supabase secret key is missing. Set SUPABASE_SECRET_KEY in .env (local dev) or create a Vault secret named "${SUPABASE_SECRET_VAULT_NAME}" (Dashboard → Vault or vault.create_secret).`
  );
}
