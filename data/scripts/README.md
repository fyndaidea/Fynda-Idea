# Data scripts (CLI)

Runnable with **`tsx`** from the Fynda Idea repo root. Env is loaded via **`data/scripts/db-env.ts`** (reads **`.env`**; see `.env.example`).

| Script | npm | What it does |
|--------|-----|----------------|
| `seed-admin-user.ts` | `npm run seed:admin -- <email> [password]` | Creates or promotes an **admin** user |

## Admin seed

| Command | Requires |
|---------|----------|
| `npm run seed:admin -- email` (no password) | `DATABASE_URL` — promotes existing `auth.users` row |
| `npm run seed:admin -- email password` | `DATABASE_URL` + `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` (or Vault) |

## `lib/db` vs `data/scripts`

- **`data/scripts/`** — CLI entrypoints: open DB, call library logic, exit.
- **`lib/db/`** — shared query/write helpers used from admin APIs and pages.
