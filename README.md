# Fynda Idea

Curated collection of startup and product ideas.

## Stack

- Next.js (App Router)
- Supabase Auth + Postgres
- Kysely

## Setup

1. Copy `.env.example` → `.env.local` and fill Supabase + `DATABASE_URL`.
2. Apply SQL in order: see `data/sql/00_README.md`.
3. `npm install && npm run dev`
4. Optional: `npm run seed:admin -- you@example.com`

## Routes

| Path | Purpose |
|------|---------|
| `/ideas` | Public idea directory |
| `/categories`, `/collections` | Taxonomy browse |
| `/submit` | Public idea intake |
| `/dashboard` | Favorites + profile |
| `/admin` | Admin CRUD |
| `/docs` | Product docs |

## Scripts

- `npm run dev` — local server
- `npm run build` — production build
- `npm run seed:admin` — promote/create admin user
