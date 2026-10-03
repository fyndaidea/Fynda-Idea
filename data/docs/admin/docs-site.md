## How `/docs` works

- Catch-all route: `app/docs/[[...slug]]/page.tsx`
- Markdown under `data/docs/{user,admin}/`
- Registry: `data/docs/manifest.json`
- Shell: `components/docs/docs-shell.tsx`

## Admin docs

Set `SHOW_ADMIN_DOCS=true` to expose `/docs/admin/*` in the docs nav. Without it, only user docs appear.
