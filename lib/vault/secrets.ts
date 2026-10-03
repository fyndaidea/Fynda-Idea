import "server-only";

import { sql } from "kysely";
import { getDb } from "@/lib/db";

const cache = new Map<string, string | null>();

/**
 * Read a named secret from Supabase Vault (`vault.decrypted_secrets`).
 * Requires `DATABASE_URL` and the Vault extension enabled on the project.
 *
 * Results are cached in memory for the lifetime of the Node process.
 */
export async function getVaultSecretByName(name: string): Promise<string | null> {
  const key = name.trim();
  if (!key) return null;
  if (cache.has(key)) {
    return cache.get(key) ?? null;
  }

  const db = getDb();
  const { rows } = await sql<{ decrypted_secret: string | null }>`
    select decrypted_secret
    from vault.decrypted_secrets
    where name = ${key}
    limit 1
  `.execute(db);

  const value = rows[0]?.decrypted_secret ?? null;
  cache.set(key, value);
  return value;
}

/** Clears in-memory Vault cache (e.g. after rotating a secret). */
export function clearVaultSecretCache() {
  cache.clear();
}
