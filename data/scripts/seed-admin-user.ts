/**
 * Create or promote an admin user (Supabase Auth + public.profiles).
 *
 * Shared logic: `lib/db/seed-admin-user.ts` (also used from **Admin → Utilities**).
 *
 * - **Promote only** (`email` with no password): needs only **`DATABASE_URL`** — pure SQL on
 *   `auth.users` + `public.profiles`. No Vault, no API keys.
 * - **New user** or **password change**: needs **`NEXT_PUBLIC_SUPABASE_URL`** plus
 *   **`SUPABASE_SECRET_KEY`** (Dashboard server “Secret key”, same as Vault `supabase_secret_key`), or
 *   **`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`** / **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (signUp for new users only).
 *
 * Usage:
 *   npm run seed:admin -- you@example.com                    # promote existing user (DATABASE_URL only)
 *   npm run seed:admin -- you@example.com 'password'           # new user or set password (needs keys + URL)
 */
import { seedAdminUser } from "../../lib/db/seed-admin-user";
import { openDatabase } from "./db-env";

async function main() {
  const emailArg = process.argv[2]?.trim();
  const passwordArg = process.argv[3] !== undefined ? String(process.argv[3]) : undefined;

  const email = emailArg || process.env.SEED_ADMIN_EMAIL?.trim();
  const password =
    passwordArg !== undefined
      ? passwordArg
      : process.env.SEED_ADMIN_PASSWORD !== undefined
        ? String(process.env.SEED_ADMIN_PASSWORD)
        : undefined;

  if (!email) {
    throw new Error(
      "Usage: npm run seed:admin -- <email> [password]\n   or set SEED_ADMIN_EMAIL and optionally SEED_ADMIN_PASSWORD."
    );
  }

  const db = openDatabase();
  try {
    const lines = await seedAdminUser(db, { email, password });
    for (const line of lines) {
      process.stdout.write(`${line}\n`);
    }
  } finally {
    await db.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
