# ALTCHA authentication protection

Every Fynda app self-hosts the MIT-licensed ALTCHA 3.3 widget and challenge/verification library. No Cloudflare account, external CAPTCHA service, site key, or paid subscription is required.

Email login (including admin login), registration, recovery requests, and existing magic-link forms submit through `/api/auth/email`. The server checks the signed proof, expiry, app scope, and one-time use before calling Supabase with the publishable key. Existing token/registration APIs also require an `altcha` payload. Admin social login and authenticated password updates retain their existing authorization and session checks.

## Setup

Apply `data/sql/41_auth_captcha.sql` to the app's Postgres database. It adds two private RLS tables for replay detection and rate limiting. CAPTCHA verification fails closed if the database or migration is missing.

Challenge signatures derive an app-specific key from the existing server-only database connection string. The connection string is never exposed to the browser. All replicas need the same database connection configuration. Rotating the database credentials invalidates outstanding challenges.

Challenges expire after ten minutes. Every submission requires a fresh proof; the UI clears it after an attempt or expiry. Replay prevention uses an atomic Postgres insert. Challenge and submission endpoints share a 300-request/minute limit per app; Vercel deployments also enforce 30 requests/minute per trusted forwarded client IP. Other hosts use the global limit until a trusted client-IP adapter is added. No raw IP addresses are stored. Expired replay and rate-limit rows are removed on subsequent CAPTCHA requests.

Use HTTPS in production. Localhost is a secure context for browser testing. The widget loads from the app's installed npm dependency, not a third-party CDN. If adding a CSP, allow the widget's bundled blob worker and styles as documented by ALTCHA.

## Limits

This protects Fynda's auth forms and auth endpoints. Supabase's public auth endpoint can still be called directly, bypassing ALTCHA. Keep Supabase's own rate limits enabled. CAPTCHA does not prevent a fake website from stealing passwords; use HTTPS, trusted auth email links, and exact redirect allowlists.

## TODO: migrate to Turnstile

- [ ] Replace `components/auth/AuthCaptcha.tsx` with a Cloudflare Turnstile widget while preserving the form layouts and admin-only social login policy.
- [ ] Configure a public site key per allowed Fynda domain and the matching secret in each Supabase project's CAPTCHA settings.
- [ ] Forward Turnstile tokens to Supabase login, registration, recovery, and magic-link methods; enable Supabase-side CAPTCHA enforcement.
- [ ] Verify direct Supabase requests without a valid token fail; verify expiry, retries, callbacks, and recovery.
- [ ] Remove ALTCHA challenge/replay endpoints and tables after the migration is complete.

References: [ALTCHA self-hosted setup](https://altcha.org/docs/integration/quick-start/), [server verification](https://altcha.org/docs/integration/server/), [Supabase CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha).
