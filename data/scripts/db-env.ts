import "dotenv/config";

import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import type { Database } from "../../lib/db/schema";

/** Kysely instance for CLI scripts; caller must `await db.destroy()` in `finally`. */
export function openDatabase(): Kysely<Database> {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL (or SUPABASE_DB_URL).");
  }

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({ connectionString }),
    }),
  });
}
