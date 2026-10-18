# Idea edits and Notion sync

Apply `data/sql/43_idea_notion_sync.sql` before deploying the editor UI. It preserves the existing catalog as the baseline (revision 0); new records and actual content changes enter the queue. A database trigger tracks changes from the admin editor, MCP, and direct database writes. Sync acknowledgements do not change the idea's updated timestamp or reorder the list.

Verified admins edit the overview, key points, metadata, and individual Markdown sections directly on each idea page. Saves stay in place and check the content revision before writing, so an older draft cannot overwrite newer changes. The page shows **Updated — pending Notion sync** until the saved revision has been copied to Idea Vault. Saving does not automatically publish to Notion.

## On a request to sync

1. Read pending ideas using the admin API `GET /api/admin/ideas?notion_sync=pending` (500 records per page; `offset` paginates), or the admin-only MCP `list_ideas` filter `notion_sync_pending: true, include_drafts: true` with `offset`.
2. Keep the returned `contentRevision` with each snapshot. Read the full body from the record/API or `get_idea`.
3. Match the existing Idea Vault page using its Fynda link, then slug/title dedupe. Compare both sides before applying app changes. Preserve existing research, statuses, and any newer Notion edits; reconcile conflicts instead of overwriting blindly. Follow Mina's existing capture/link rules for unmatched new ideas.
4. After the Notion write succeeds and its content is verified, acknowledge that exact revision with `PATCH /api/admin/ideas/{id}/notion-sync`, JSON `{ "revision": 1 }`, or MCP `acknowledge_idea_notion_sync` with `{ "id": "…", "revision": 1 }`.
5. A 409/conflict means another edit happened or the idea was deleted. Re-read and sync the new snapshot; never clear its marker using the older snapshot. Failed Notion writes must remain pending.

Both admin API operations require verified authentication and the database-backed admin role. MCP acknowledgement additionally requires `ideas:write`; the pending filter requires an admin even on a read key. No user-facing button can prematurely mark a record synchronized.

## Verification

`TEST_DATABASE_URL` must explicitly point at a database with migration 43 applied. Run `node --conditions=react-server --import tsx --test tests/idea-notion-sync.test.ts`; integration fixtures always roll back. Without that variable, the database test is skipped.

Personal workflow stages are stored per account and use the verified Idea Vault status names. They do not change the global listing or its Notion sync revision. See [personal idea tracking](idea-progress.md).
