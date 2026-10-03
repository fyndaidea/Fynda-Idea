import { createHash } from "crypto";
import { sql } from "kysely";
import { getDb } from "@/lib/db";

export const API_KEY_PREFIX = "sk_live_";

export function isApiKeyToken(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX);
}

export function hashApiKey(plainKey: string): string {
  return createHash("sha256").update(plainKey, "utf8").digest("hex");
}

export type ResolvedApiKey = {
  userId: string;
  mcpPermissions: string[];
};

/** Resolve user from a plain API key; bumps usage stats on success. */
export async function resolveApiKeyUser(
  plainKey: string
): Promise<ResolvedApiKey | null> {
  if (!isApiKeyToken(plainKey)) return null;

  const hash = hashApiKey(plainKey);
  const row = await getDb()
    .selectFrom("user_api_keys")
    .select(["id", "user_id", "mcp_permissions"])
    .where("key_hash", "=", hash)
    .where("active", "=", true)
    .executeTakeFirst();

  if (!row) return null;

  const now = new Date();
  void getDb()
    .updateTable("user_api_keys")
    .set({
      usage_count: sql`usage_count + 1`,
      last_used_at: now,
      updated_at: now,
    })
    .where("id", "=", row.id)
    .execute()
    .catch((e) => console.error("API key usage update failed:", e));

  return {
    userId: row.user_id,
    mcpPermissions: row.mcp_permissions ?? [],
  };
}
