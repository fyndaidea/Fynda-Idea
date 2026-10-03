# Environment variables

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Canonical URL for auth redirects |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client-safe Supabase key |
| `DATABASE_URL` | Postgres connection string (Kysely + Vault) |
| `SHOW_ADMIN_DOCS` | Expose `/docs/admin` when `true` |
| `NEXT_PUBLIC_SALES_EMAIL` | Public contact email (`hello@fynda.idea`) |
| `SUPABASE_SECRET_KEY` | Optional server secret for admin seeding / storage |

There is no Stripe or MCP configuration for Idea.
