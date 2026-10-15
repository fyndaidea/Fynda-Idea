import "server-only";
import { createHmac } from "node:crypto";
import { Pool } from "pg";
import { STORE_APP_KEY } from "@/lib/store/config";
import { newCaptchaChallenge, verifyCaptchaProof } from "./captcha-proof";

export class CaptchaError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const pools = globalThis as typeof globalThis & { fyndaCaptchaPools?: Map<string, Pool> };
function db() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;
  if (!connectionString) throw new CaptchaError("Security verification is unavailable. Please try again later.", 503);
  pools.fyndaCaptchaPools ??= new Map();
  if (!pools.fyndaCaptchaPools.has(STORE_APP_KEY)) pools.fyndaCaptchaPools.set(STORE_APP_KEY, new Pool({ connectionString, max: 2, connectionTimeoutMillis: 5000, statement_timeout: 5000 }));
  return pools.fyndaCaptchaPools.get(STORE_APP_KEY)!;
}
function secret() {
  const key = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_DATABASE_URL;
  if (!key) throw new CaptchaError("Security verification is unavailable. Please try again later.", 503);
  return createHmac("sha256", key).update(`fynda-auth-altcha:${STORE_APP_KEY}`).digest("hex");
}
export function requireCaptchaOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (request.method === "POST" && origin !== new URL(request.url).origin) throw new CaptchaError("Invalid request origin.", 403);
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new CaptchaError("Invalid request origin.", 403);
}
async function rateLimit(request: Request, scope = "auth", ipLimit = 30, appLimit = 300) {
  // The app-wide limit still applies when a deployment cannot provide a trusted client IP.
  const ip = process.env.VERCEL === "1" ? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() : null;
  const minute = Math.floor(Date.now() / 60000);
  for (const [identity, limit] of [["app", appLimit], ...(ip ? [[ip, ipLimit]] : [])] as [string, number][]) {
    const key = createHmac("sha256", secret()).update(`${scope === "auth" ? "" : `${scope}:`}${identity}:${minute}`).digest("hex");
    const { rows } = await db().query("INSERT INTO public.auth_captcha_limits (app_key,bucket,attempts,expires_at) VALUES ($1,$2,1,now()+interval '2 minutes') ON CONFLICT (app_key,bucket) DO UPDATE SET attempts=auth_captcha_limits.attempts+1 WHERE auth_captcha_limits.attempts < $3 RETURNING attempts", [STORE_APP_KEY, key, limit]);
    if (!rows.length) throw new CaptchaError("Too many attempts. Please wait a minute and try again.", 429);
  }
  await db().query("DELETE FROM public.auth_captcha_uses WHERE expires_at < now()");
  await db().query("DELETE FROM public.auth_captcha_limits WHERE expires_at < now()");
}
/** Guests can join the launch waitlist without an account, so cap signups per client IP and app-wide. */
export async function allowGuestWaitlist(request: Request): Promise<boolean> {
  try {
    await rateLimit(request, "waitlist", 5, 60);
    return true;
  } catch (error) {
    if (error instanceof CaptchaError && error.status === 429) return false;
    throw error;
  }
}
export async function issueCaptcha(request: Request) {
  requireCaptchaOrigin(request);
  await rateLimit(request);
  return newCaptchaChallenge(secret(), STORE_APP_KEY);
}
export async function consumeCaptcha(request: Request, payload: unknown) {
  requireCaptchaOrigin(request);
  await rateLimit(request);
  const valid = await verifyCaptchaProof(payload, secret(), STORE_APP_KEY, async (signature, expiresAt) => {
    const { rows } = await db().query("INSERT INTO public.auth_captcha_uses (app_key,signature,expires_at) VALUES ($1,$2,to_timestamp($3)) ON CONFLICT DO NOTHING RETURNING signature", [STORE_APP_KEY, signature, expiresAt]);
    return rows.length === 1;
  });
  if (!valid) throw new CaptchaError("Complete a fresh security verification and try again.");
}
