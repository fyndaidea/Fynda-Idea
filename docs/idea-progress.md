# Personal idea tracking and inline editing

Canvas is the selected idea-page design. The lower area has a **Details layout** switcher: **Split**, **Panels**, and **Reading**. Selection is stored in the `body` URL parameter; the Canvas header stays the same.

## Personal stages

The status menu stores a private stage under the authenticated user and stable idea ID. It works independently of favorites. An unset stage displays **Set status**; choosing **Clear status** removes that user's tracker entry. Read-only badges display **No status** when unset. There is no visible “My status” label. `/dashboard?section=ideas` lists tracked ideas, filters them by stage, and lets the user update stages there. The dashboard overview also includes recent tracked ideas.

The options match the Idea Vault Status schema, verified on 2026-10-17 from data source `ed0807f3-3673-82d5-9589-07793eed341c`:

- Raw, To Review, Under Review, Reviewed, Analyzed, Potential, 🔥Ready for build
- In Progress, MVP / Build
- Live / Launched, Paused, Killed, Archived

No stage is chosen automatically. Listing publication (`draft` / `published`) stays separate. Personal stages do not update Notion or another user's stage. A future explicit request to sync personal stages must use the requesting account's data and reconcile it with the intended Notion page; never collapse multiple users' stages into one global status automatically.

Idea cards and preview footers also show the personal stage. Admins can change their own stage directly there; other accounts see a read-only label on these surfaces and can continue using their personal tracker and full idea page. Nik confirmed these controls use the existing personal stage rather than a shared listing stage. Selectors and favorites are separate from the card's preview link.

The custom menu uses grouped stage options, colored indicators and a selected checkmark. A native auto popover provides top-layer placement and outside-click dismissal, including inside the native preview dialog. Positioning flips above the trigger near the bottom edge and keeps the list inside the viewport. Arrow keys, Home/End and typeahead move focus; Enter/Space choose a stage; Escape closes the menu and restores trigger focus without closing the preview. Stages remain optional; catalog/Notion stages are not automatically assigned as personal stages.

Cards, previews, and full-page selectors share an account-scoped client store. Visible cards load all tracked stages in one request, and successful saves update every mounted selector for the same idea. Reads revalidate on mount; failed saves retain the saved stage. Responses identify their authenticated owner, and saves include an expected account precondition so an account switch cannot silently apply an old view's change to a different account.

The preview footer places the listing's saved update date (UTC) and credited `authorName` on the left, with the personal stage on the right. **By** uses the existing author field; the database does not currently record a separate last-editor identity. Missing metadata displays **Not recorded**; partial previews show a loading placeholder until fetched.

`GET /api/idea-progress` returns only the authenticated account's tracked published ideas. Optional `ideaId` filters one idea. `PATCH` accepts `{ ideaId, status }`, with `null` clearing a stage. The owner always comes from verified session/API authentication; client-supplied user IDs are ignored. Responses are private and uncached.

Apply `data/sql/44_user_idea_progress.sql` before deployment. The `user_idea_progress` table uses a composite `(user_id, idea_id)` key, foreign keys, a status constraint, and owner-only row-level security. Renaming an idea preserves its tracked stages; dashboard links use the current slug. The existing app access gate is preserved.

## Inline listing edits

Admins see pencils on the overview, key points, details/tags/categories, full body, and individual top-level Markdown sections. Editing and saving happen within the current page. Failed saves preserve the draft; cancelling restores keyboard focus to the edit button.

`PATCH /api/admin/ideas/{id}/sections` validates a specific section payload and requires the database-backed admin role and verified authentication. A revision precondition prevents stale edits from overwriting a newer snapshot. Section slicing preserves all source outside the edited section, including intros, neighboring sections, and fenced code. The body still renders as one Markdown document, preserving cross-section references.

Listing edits update the global content revision and **Updated — pending Notion sync** marker. See [Notion sync](idea-notion-sync.md). Personal-stage changes never enter that global content queue.

## Verification

With an explicit `TEST_DATABASE_URL` and migrations 43/44 applied:

```sh
node --conditions=react-server --import tsx --test tests/idea-progress.test.ts tests/idea-notion-sync.test.ts
```

Database fixtures, credential-free test identities, and edits are all rolled back. Tests cover source preservation, validated section fields, per-user isolation, actual RLS enforcement, stable ID tracking after renames, revision conflicts, and Notion acknowledgements. Without the environment variable, database tests are skipped.
