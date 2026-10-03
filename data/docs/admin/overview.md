# Project overview

Fynda Idea is a Next.js App Router product with:

- Public routes for ideas, categories, collections, submit, auth, docs, feedback
- Admin UI under `/admin` for ideas CRUD, taxonomy, submissions, feedback, roadmap, releases, users
- Postgres (Supabase) via Kysely — see `data/sql/`
- Auth via Supabase Auth + `profiles.role`
