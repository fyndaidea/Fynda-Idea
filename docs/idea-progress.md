# Personal idea tracking and inline editing

Canvas is the selected idea-page design, with **Panels** selected as the default details layout. The comparison switcher still offers Split, Panels and Reading through the `body` URL parameter; new links without a variation use Panels. The Canvas header stays the same.

## Personal stages

The status menu stores a private stage under the authenticated user and stable idea ID. It works independently of favorites. An unset stage displays **Set status**; choosing **Clear status** removes that user's tracker entry. Signed-out badges display **No status** when unset. There is no visible “My status” label. `/dashboard?section=ideas` lists tracked ideas, filters them by stage, and lets the user update stages there. The dashboard overview also includes recent tracked ideas. The navigation and headings use **Idea tracker**, since these are catalog ideas a user is considering rather than ideas they own.

The options match the Idea Vault Status schema, verified on 2026-10-17 from data source `ed0807f3-3673-82d5-9589-07793eed341c`:

- Raw, To Review, Under Review, Reviewed, Analyzed, Potential, 🔥Ready for build
- In Progress, MVP / Build
- Live / Launched, Paused, Killed, Archived

No stage is chosen automatically. Listing publication (`draft` / `published`) stays separate. Member stage changes never update Notion or another user's stage. A verified admin selecting a concrete stage also updates the corresponding Idea Vault Status property. This does not change other users' personal stages. Clearing a tracker entry is personal-only for admins too and does not reset or demote the vault record.

Idea cards and preview footers also show the personal stage. Every signed-in account can change its own stage directly on these surfaces, as well as on the tracker and full idea page. Nik confirmed these controls use the existing personal stage rather than a shared listing stage. Selectors and favorites are separate from the card's preview link.

The custom menu uses grouped stage options, colored indicators and a selected checkmark. A native auto popover provides top-layer placement and outside-click dismissal, including inside the native preview dialog. Positioning flips above the trigger near the bottom edge and keeps the list inside the viewport. Arrow keys, Home/End and typeahead move focus; Enter/Space choose a stage; Escape closes the menu and restores trigger focus without closing the preview. Stages remain optional; catalog/Notion stages are not automatically assigned as personal stages.

Cards, previews, and full-page selectors share an account-scoped client store. Visible cards load all tracked stages in one request, and successful saves update every mounted selector for the same idea. Reads revalidate on mount; failed saves retain the saved stage. Responses identify their authenticated owner, and saves include an expected account precondition so an account switch cannot silently apply an old view's change to a different account.

The preview footer places the listing's saved update date (UTC) and credited `authorName` on one line on the left, with the personal stage on the right. Long author names truncate rather than breaking the metadata into separate lines. **By** uses the existing author field; the database does not currently record a separate last-editor identity. Missing metadata displays **Not recorded**; partial previews show a loading placeholder until fetched.

`GET /api/idea-progress` returns only the authenticated account's tracked published ideas. Optional `ideaId` filters one idea. `PATCH` accepts `{ ideaId, status }`, with `null` clearing a stage. The owner always comes from verified session/API authentication; client-supplied user IDs are ignored. Responses are private and uncached.

Apply `data/sql/44_user_idea_progress.sql` before deployment. The `user_idea_progress` table uses a composite `(user_id, idea_id)` key, foreign keys, a status constraint, and owner-only row-level security. Renaming an idea preserves its tracked stages; dashboard links use the current slug. The existing app access gate is preserved.

## Inline listing edits

Admins see pencils on the overview, key points, details/tags/categories, full body, and individual top-level Markdown sections. Editing and saving happen within the current page. Failed saves preserve the draft; cancelling restores keyboard focus to the edit button.

`PATCH /api/admin/ideas/{id}/sections` validates a specific section payload and requires the database-backed admin role and verified authentication. A revision precondition prevents stale edits from overwriting a newer snapshot. Section slicing preserves all source outside the edited section, including intros, neighboring sections, and fenced code. The body still renders as one Markdown document, preserving cross-section references.

Listing edits update the global content revision and **Updated — pending Notion sync** marker. See [Notion sync](idea-notion-sync.md). Stage changes never enter that global content queue. Admin stage writes use the dedicated Notion integration described below.

## Admin stage synchronization

`saveIdeaStageForUser` checks `profiles.role` for the authenticated owner. It never uses a client role or user-supplied page ID. Ordinary member saves only call the owner-scoped tracker database operation. For an admin selecting a concrete stage, it first updates and verifies Notion, then saves that admin's tracker. Notion failures leave the tracker unchanged and return a retryable error; if the local save fails after Notion succeeds, the error explicitly reports the partial result. Concurrent admin choices use Notion's last accepted write; they never rewrite other users' trackers.

The target comes from exactly one explicit `Notion:` / `Idea Vault:` backlink in the saved listing body. Before writing, the integration verifies its parent database, active state, Entry Type = Idea, and reciprocal Link origin/path for this listing. It sends only `properties.Status`; descriptions, research, other properties and catalog publication stay untouched. All 1,358 current catalog backlinks were checked when enabling this flow.

Server configuration: `NOTION_TOKEN` or encrypted Supabase Vault secret **fynda_idea_notion_token**. `IDEA_VAULT_DATABASE_ID` defaults to Mina's Idea Vault (`1a2807f336738239be4d81e6147e7a49`). The existing Mina integration was validated and stored in that encrypted server-only secret on 2026-10-17. No live idea stages were changed by setup or tests. Never expose the credential through client variables or responses.

Clearing a Notion Status through the API can reset it to its default option, so **Clear status** intentionally removes only the user's tracker row. See [Notion property writes](https://developers.notion.com/reference/page-property-values).

## Verification

With an explicit `TEST_DATABASE_URL` and migrations 43/44 applied:

```sh
node --conditions=react-server --import tsx --test tests/idea-progress.test.ts tests/idea-notion-sync.test.ts tests/idea-stage-sync.test.ts
```

Database fixtures, credential-free test identities, and edits are all rolled back. Tests cover source preservation, validated section fields, per-user isolation, actual RLS enforcement, stable ID tracking after renames, revision conflicts, and Notion acknowledgements. Without the environment variable, database tests are skipped.
