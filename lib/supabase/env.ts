/**
 * Supabase publishable key (sb_publishable_...) or legacy anon key for client-side use.
 * Values are trimmed so whitespace-only entries in `.env` do not count as configured.
 *
 * Important: use static `process.env.NEXT_PUBLIC_*` reads only. Dynamic lookup
 * (`process.env[name]`) is not inlined for middleware, so auth guards could see missing vars.
 */
export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
}

export function getSupabaseClientKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    "";
  return key || "placeholder-key";
}

export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseClientKey();
  return Boolean(url && key !== "placeholder-key");
}

