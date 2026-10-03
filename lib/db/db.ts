import "server-only";

import { Kysely, PostgresDialect } from "kysely";
import pg from "pg";
import type { Database } from "./schema";

const { Pool } = pg;

declare global {
  // eslint-disable-next-line no-var
  var __fyndaDb: Kysely<Database> | undefined;
}

function createDb(): Kysely<Database> {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.SUPABASE_DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase Postgres connection string."
    );
  }

  return new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
        max: 5,
      }),
    }),
  });
}

export function getDb(): Kysely<Database> {
  if (!globalThis.__fyndaDb) {
    globalThis.__fyndaDb = createDb();
  }
  return globalThis.__fyndaDb;
}

