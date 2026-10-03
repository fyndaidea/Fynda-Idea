import { GoTrueAdminApi } from "@supabase/auth-js";
import { createClient } from "@supabase/supabase-js";
import { sql } from "kysely";
import type { Kysely } from "kysely";
import type { Database } from "./schema";

const VAULT_SECRET_NAME = "supabase_secret_key";

export const SEED_ADMIN_CREATE_HELP = [
  "Creating a user or changing a password must go through Supabase Auth (not raw SQL). Provide:",
  "  • NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (Dashboard server Secret key), or Vault supabase_secret_key, or",
  "  • NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (new users only, via signUp).",
].join("\n");

/**
 * `sb_secret_*` keys are not JWTs. Hosted Supabase requires `Authorization` to match `apikey`
 * exactly (no `Bearer `). `createClient` always sends `Bearer`, which breaks the Admin API.
 * Legacy `service_role` JWTs still use `Authorization: Bearer <key>`.
 */
function authAdminHeadersForSecretKey(secretKey: string): Record<string, string> {
  const k = secretKey.trim();
  if (k.startsWith("sb_publishable_")) {
    throw new Error(
      "SUPABASE_SECRET_KEY must be the server Secret key (sb_secret_… or legacy service_role JWT), not the publishable key."
    );
  }
  if (k.startsWith("sb_secret_")) {
    return { apikey: k, Authorization: k };
  }
  return { apikey: k, Authorization: `Bearer ${k}` };
}

function createAuthAdminApi(projectUrl: string, secretKey: string): GoTrueAdminApi {
  const base = projectUrl.replace(/\/+$/, "");
  return new GoTrueAdminApi({
    url: `${base}/auth/v1`,
    headers: authAdminHeadersForSecretKey(secretKey),
  });
}

function loadServiceKeyFromEnv(): string | null {
  return process.env.SUPABASE_SECRET_KEY?.trim() || null;
}

function loadAnonOrPublishableFromEnv(): string | null {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    null
  );
}

async function resolveServiceKeyOptional(db: Kysely<Database>): Promise<string | null> {
  const fromEnv = loadServiceKeyFromEnv();
  if (fromEnv) return fromEnv;
  try {
    const { rows } = await sql<{ decrypted_secret: string | null }>`
      select decrypted_secret
      from vault.decrypted_secrets
      where name = ${VAULT_SECRET_NAME}
      limit 1
    `.execute(db);
    return rows[0]?.decrypted_secret?.trim() ?? null;
  } catch {
    return null;
  }
}

async function upsertAdminProfile(db: Kysely<Database>, userId: string) {
  await sql`
    insert into public.profiles (id, role, updated_at)
    values (${userId}, 'admin', now())
    on conflict (id) do update set role = 'admin', updated_at = now()
  `.execute(db);
}

/**
 * Promote an existing auth user to admin (password optional), or create a new admin user when
 * password is set. Uses the same rules as `npm run seed:admin`.
 *
 * @param db — Kysely instance; do not destroy when this is the app singleton from `getDb()`.
 */
export async function seedAdminUser(
  db: Kysely<Database>,
  params: { email: string; password?: string | null }
): Promise<string[]> {
  const messages: string[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const email = params.email.trim();
  if (!email) {
    throw new Error("Email is required.");
  }

  const password = params.password;
  const wantsPassword = password !== undefined && password !== null && String(password) !== "";

  const found = await sql<{ id: string }>`
    select id from auth.users where lower(email) = lower(${email}) limit 1
  `.execute(db);

  if (found.rows[0]) {
    const userId = found.rows[0].id;

    if (wantsPassword) {
      if (!url) {
        throw new Error(
          `NEXT_PUBLIC_SUPABASE_URL is required to update password.\n\n${SEED_ADMIN_CREATE_HELP}`
        );
      }
      const serviceKey = await resolveServiceKeyOptional(db);
      if (!serviceKey) {
        throw new Error(
          `Updating password requires SUPABASE_SECRET_KEY or Vault "${VAULT_SECRET_NAME}".\n\n${SEED_ADMIN_CREATE_HELP}`
        );
      }
      messages.push("Using server secret key (Admin API) to update password.");
      const admin = createAuthAdminApi(url, serviceKey);
      const { error } = await admin.updateUserById(userId, { password: String(password) });
      if (error) throw error;
      messages.push(`Password updated for existing user id=${userId}`);
    } else {
      messages.push(`Promoting existing user via SQL only (DATABASE_URL). id=${userId}`);
    }

    await upsertAdminProfile(db, userId);
    messages.push(`Profile role set to admin for ${email}`);
    return messages;
  }

  if (!wantsPassword) {
    throw new Error(
      `No auth user found for ${email}. Pass a password to create one, or register first.\n\n${SEED_ADMIN_CREATE_HELP}`
    );
  }

  if (!url) {
    throw new Error(`Missing NEXT_PUBLIC_SUPABASE_URL.\n\n${SEED_ADMIN_CREATE_HELP}`);
  }

  const serviceKey = await resolveServiceKeyOptional(db);
  if (serviceKey) {
    messages.push("Using server secret key (Admin API) to create user.");
    const admin = createAuthAdminApi(url, serviceKey);
    const { data, error } = await admin.createUser({
      email,
      password: String(password),
      email_confirm: true,
    });
    if (error) throw error;
    if (!data.user?.id) throw new Error("createUser returned no user id");
    messages.push(`Created user id=${data.user.id}`);
    await upsertAdminProfile(db, data.user.id);
    messages.push(`Profile role set to admin for ${email}`);
    return messages;
  }

  const anonKey = loadAnonOrPublishableFromEnv();
  if (!anonKey) {
    throw new Error(
      `No SUPABASE_SECRET_KEY (or Vault key) and no publishable/anon key. Cannot create user.\n\n${SEED_ADMIN_CREATE_HELP}`
    );
  }

  messages.push("Using publishable/anon key (signUp) to create user.");
  const pub = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await pub.auth.signUp({ email, password: String(password) });
  if (error) throw error;
  if (!data.user?.id) {
    throw new Error(
      "signUp returned no user id (check email confirmation settings in Supabase)."
    );
  }
  messages.push(
    `Created user id=${data.user.id}. If email confirmation is on, confirm before login.`
  );
  await upsertAdminProfile(db, data.user.id);
  messages.push(`Profile role set to admin for ${email}`);
  return messages;
}
