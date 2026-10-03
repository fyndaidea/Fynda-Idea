## Purpose

In production, the Supabase **secret key** can be stored in Supabase Vault as `supabase_secret_key` instead of (or in addition to) `SUPABASE_SECRET_KEY` in env.

## Local

For local development, set `SUPABASE_SECRET_KEY` in `.env.local` (see `.env.example`).

## Code

`lib/supabase/secret-key.ts` and `lib/vault/secrets.ts` resolve the key: env first, then Vault via `DATABASE_URL`.
