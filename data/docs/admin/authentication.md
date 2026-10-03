## Auth mechanisms

| Mechanism | Used by | How |
|-----------|---------|-----|
| Supabase session cookie | Browser pages + most `/api/*` | `createClient()` / `getApiUser` |
| Bearer Supabase JWT | Some API clients | `Authorization: Bearer <access_token>` |
| API key (`sk_live_…`) | MCP + programmatic APIs | `X-API-Key` or `Authorization: Bearer sk_live_…` via `resolveApiKeyUser` / `getApiUser` |
| MCP OAuth tokens | Remote MCP connectors | Issued under `/api/mcp/oauth` (`MCP_OAUTH_SECRET`) |

## Roles

`profiles.role`:

- `user` — default
- `admin` — full admin UI

Promote: `UPDATE profiles SET role = 'admin' WHERE id = '…';`

Or: `npm run seed:admin -- you@example.com`

## Route protection

| Surface | Gate |
|---------|------|
| `/admin/*` | `proxy.ts` → login; `requireAdmin` |
| `/dashboard` | `proxy.ts` → login; `requireUser` |
| `/api/admin/*` | Each handler: `requireAdminApiResponse` (proxy does **not** protect `/api`) |

Post-login redirect (`lib/auth/post-login-path.ts`):

- Explicit safe `?next=` path preferred
- Else admins → `/admin`
- Else → `/dashboard`

## Client auth sync

`AuthProvider` loads `GET /api/profile`. Registration may call `POST /api/auth/sync-profile` to ensure a `profiles` row exists.
