## File

**`proxy.ts`** at the repo root is the Next.js **proxy** convention (replaces deprecated `middleware.ts`). It runs before matched routes.

## Matcher

The proxy runs on page routes. Excluded paths:

- `/api/*` — API handlers manage their own auth
- `/auth/*` — OAuth callback
- Static assets and `_next/*`

## Behavior (in order)

1. **Missing Supabase env** on `/admin/*` → redirect to `/login?reason=configure`.
2. **`updateSession`** — refreshes cookie-backed session (`lib/supabase/middleware.ts`).
3. **No user** on `/admin/*` or `/dashboard` → redirect to `/login?next=<path>`.
4. **User present** on `/login` or `/register` → redirect via `resolvePostLoginPath`.

Public routes still get session refresh when matched, but are not login-gated.

## Related

- [Authentication](/docs/admin/authentication)
- [Environment variables](/docs/admin/environment)
