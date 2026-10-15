# Digital store

Each app keeps its own catalog key in `lib/store/config.ts`, including app-scoped products, orders and private file paths.

Payment-provider integration is deferred. The storefront and admin product editor remain available, but the purchase button is disabled. There are no checkout or payment-webhook routes and no store-specific environment variables.

## Existing app configuration

Use the app’s existing database and Supabase authentication/storage settings. Admin-only social login remains enforced. Admin writes use the existing `NEXT_PUBLIC_SITE_URL` or `NEXT_PUBLIC_APP_URL` for origin checks; when neither is configured, they use the current request origin. A separate store URL is unnecessary.

Apply `data/sql/40_digital_store.sql` after the existing profile migrations to create store tables, the private `fynda-store-downloads` bucket, and profile-role protection. The bucket name is a code constant, not an environment setting. Store downloads must stay separate from the public media bucket. Review migrations before applying them to production; existing order data is not deleted.

Administrators manage products at `/admin/store`. Private uploads use a signed token for a single immutable object and transfer directly to Storage. The server verifies the file and its size before publishing. Preserve files attached to existing purchases.

`/store` provides the catalog and product details. `/store/purchases` retains the library for existing purchases. Download access still requires an owned, paid order; no route grants paid access or creates new purchases while payments are deferred.

Run `npm run test:store` and the app’s TypeScript/build checks after changes.
