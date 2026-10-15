<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Social login policy

Social/provider login is reserved for existing admins across all Fynda apps. Keep registration and ordinary sign-in email-only. Offer social login only in admin sign-in flows, and enforce the database-backed admin role using verified session authentication-method claims in callbacks, cookie sessions, and bearer-token authorization. A linked social identity or an admin return URL is never proof of admin access. Preserve email confirmation, recovery, and email login for non-admin users.

## Digital store

This app uses its own catalog key in `lib/store/config.ts`. Preserve app-scoped products/orders, server-only prices, provider-independent purchase access, private download storage and admin-only product writes. See `docs/digital-store.md` for setup.
