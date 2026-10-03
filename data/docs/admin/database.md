# Database

Apply migrations in order (see `data/sql/00_README.md`):

1. `01_profiles.sql` — profiles + favorites `{ "idea": [] }`
2. `02_ideas.sql`
3. `03_idea_submissions.sql`
4. `04_categories.sql` (seeded categories)
5. `05_collections.sql`
6. `06_feedback_board.sql`

Promote an admin:

```sql
UPDATE public.profiles SET role = 'admin' WHERE id = '...';
```

Or: `npm run seed:admin -- you@example.com`
