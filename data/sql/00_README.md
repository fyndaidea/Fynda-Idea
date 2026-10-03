# SQL migrations (Fynda Idea)

Apply **in order** using Supabase SQL Editor or `psql` against `DATABASE_URL`.

| Order | File | Purpose |
|-------|------|---------|
| 01 | `01_profiles.sql` | `profiles` (favorites JSONB `{ "idea": [] }`), auth signup trigger, RLS |
| 02 | `02_ideas.sql` | `ideas` table + RLS (public read published; admin write) |
| 03 | `03_idea_submissions.sql` | `idea_submissions` public intake + RLS |
| 04 | `04_categories.sql` | `categories` + seed categories + RLS |
| 05 | `05_collections.sql` | `collections`, `collection_ideas` + RLS |
| 06 | `06_feedback_board.sql` | `feedback_posts`, `feedback_votes`, `roadmap_items`, `release_notes` + RLS |
| 07 | `07_user_api_keys.sql` | `user_api_keys` for MCP / programmatic access + RLS |

Favorites live in `profiles.favorites` JSONB — there is no separate favorites table.

### Apply all (bash)

```bash
for f in \
  data/sql/01_profiles.sql \
  data/sql/02_ideas.sql \
  data/sql/03_idea_submissions.sql \
  data/sql/04_categories.sql \
  data/sql/05_collections.sql \
  data/sql/06_feedback_board.sql \
  data/sql/07_user_api_keys.sql
do
  psql "$DATABASE_URL" -f "$f"
done
```

### After SQL: seed data (optional)

See **`data/scripts/README.md`** — `seed:admin`, etc.

### Admin access

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '...';
```
