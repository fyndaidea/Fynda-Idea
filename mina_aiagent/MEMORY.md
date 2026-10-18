# MEMORY — Mina Idea Steward

Standing instructions and session memory for this agent. Read this **with** `AGENT.md` at the start of work.

Update this file when the user gives a lasting preference or when a major capture / hygiene / queue pass completes. Do not put secrets here.

---

## Standing user instructions

1. **Mina is the Idea Steward.** She maintains Ideas in the Notion **Idea Vault** (Capture → Classify → Dedupe → Curate → Queue) **and** the live **Fynda Idea** directory (`https://fynda-idea-prod.vercel.app/`). Not the build pick (Nik). Not Ron’s default full-template research. Not Mira’s AST sync. Not Atlas/Eden catalogs.
2. **New captures** land as **To Review**, Entry Type **Idea**, Source **Mina** (unless a named source is provided).
3. **Dedupe before create.** Merge only when authorized; never casually archive a **Potential** / Ready pick.
4. **No invented research** — capture briefs and hygiene notes only unless Nik asks Mina to fill Ron’s full Idea template.
5. **Queue clearly:** To Review → Ron; researched bodies → Nik’s pick pool; thin stubs → hygiene backlog. Never set Status = Reviewed.
6. **No secrets in docs.** Keep Notion tokens in gitignored `.env` only.
7. **Keep agent MD files current** after major passes.
8. **Git: before starting any operation, `git pull` (or `git fetch` + `git pull`) on the current branch so the workspace matches GitHub.** Do **not** start durable work on a stale clone. Prefer GitHub as source of truth when local and remote diverge.
9. **Git: when the work is done, commit and push to `main` (or `master`) immediately.** Do **not** leave durable work uncommitted on the machine. Do **not** wait until later. Do **not** create feature branches or pull requests unless the user explicitly asks.
10. **Never set Notion Status = Reviewed** unless Nik explicitly asks. Write research / dual-write / tags / links as usual; leave Status alone (usually `To Review` / `Under Review` / whatever it already is). Applies fleet-wide to every vault.
11. **Publish captures by default and keep Idea Vault synchronized.** Nik explicitly confirmed on 2026-10-16: “always publish it. make sure idea vault in notion is in sync.” For requested additions, dedupe first, create published Fynda Idea listings, capture/link their Idea Vault records, and append new notes to existing keepers while preserving descriptions, research and statuses. Do not ask for publication permission again unless scope changes or an external approval block requires it.

---

## Defaults

| Preference | Value |
|---|---|
| Live directory | **Fynda Idea** (`FYNDA_IDEA_BASE_URL` + `FYNDA_IDEA_API_KEY`) |
| Vault system of record | **Idea Vault** (`IDEA_VAULT_DATABASE_ID`) — **Entry Type = Idea** only |
| Env shape | Match **Atlas / Eden**: Fynda first → `NOTION_TOKEN` → `IDEA_VAULT_DATABASE_ID` only. No Product / Social Network vault ids. Prefs in MEMORY, not `MINA_*` env. |
| Default mode | **Capture** (new notes) or **Full steward** (“maintain Ideas”) |
| Capture batch cap | **15** |
| New Idea Status | **To Review** |
| Merge bar | Exact token-set **or** Jaccard ≥ 0.8 with ≥ 3 shared tokens |
| Bulk merge | Confirm unless Nik says “merge duplicates” / “clean twins” this run |
| Timezone | **America/Toronto** |
| Git start | **`git pull` before starting any operation** — match GitHub first |
| Git workflow | **Commit + push to `main`/`master` as soon as the work is done** — no branches / PRs unless asked |

---

## Exclusions

_Do not capture / keep these as active Ideas unless the user overrides._

| Pattern | Why excluded | Since |
|---|---|---|
| Thin volume Ideas (`Concept: “…” — a general / misc opportunity to validate`) | No readable research — hygiene only, do not dress as Reviewed | 2026-08-29 |
| GLP-1 shot logger / Shotsy-MeAgain clones | Mira/Vera standing skip | 2026-08-29 |

---

## Open queues

| Queue | Owner | Notes |
|---|---|---|
| Research (To Review Ideas) | Ron | Mina captures / classifies into this queue |
| Pick pool (researched Ideas w/ body) | Nik | Mina does not thin-stub pollute this list |
| Hygiene (thin / twins / false Reviewed) | Mina | Primary steward backlog |

---

## Last pass

### Shopify subscriptions and recommendation quizzes (2026-10-16)

- Published **Shopify product subscriptions app — Appstle / Recharge alternative** and **Shopify product recommendation quiz app — Quiz Kit / Quizell alternative** after checking both surfaces for duplicates.
- Preserved all four Shopify App Store reference URLs in the two capture bodies. No fabricated pricing, traction, differentiation or conviction.
- Both Idea Vault records are **To Review** and link to their published listings; each listing links back. **After:** Idea Vault/Fynda Idea **1,344 / 1,344**.
- Mapping: [Shopify app captures](./captures/2026-10-16-shopify-apps.md).

### Drama/distribution and women-focused app follow-up (2026-10-16)

- Appended “build both the AI drama/reels/TV production tool and distribution” to the existing drama keeper on both surfaces.
- Published **Women-focused versions of proven apps + AI influencer distribution**, using X post `2111121464187597007` (author/content recovered from the public FxTwitter mirror) plus Nik’s AI woman influencer promotion angle.
- Related broad Women apps/Women niches records remain intact. Existing descriptions/research preserved; both affected Notion records remain **To Review**, with matched live links and vault backlinks.
- **After:** Idea Vault and Fynda Idea each contain **1,342** ideas.
- Mapping: [follow-up captures](./captures/2026-10-16-follow-up.md).

### Nik's idea intake (2026-10-16)

- **24 nonblank inputs → 23 ideas:** 15 new published listings plus appended notes on 8 existing keepers, synchronized with Idea Vault.
- Item **13** is a reference for the existing website/automation idea (**10**); item **25** was blank.
- All **23** vault records remain **To Review**. Existing descriptions, research, statuses and catalog ranking scores were preserved. No archive/delete.
- Inaccessible Reddit/Facebook references remain in titles as requested; “charge for calls setup” is preserved without guessing the service.
- **After:** Idea Vault **1,341**; Fynda Idea **1,341 published**. Each affected vault Link points to its live listing, and each listing links back to its vault record.
- Nik's standing instruction: **always publish captures and keep Idea Vault synchronized**. Initial private drafts were published after explicit approval.
- Full mapping: [2026-10-16 intake](./captures/2026-10-16-intake.md).

### Idea Vault → Fynda Idea full sync (2026-10-15)

| Field | Value |
|---|---|
| Vault pages | **1326** (all Entry Type = Idea, Status left **To Review**) |
| Already live (not twinned) | **10** Set 1 companions |
| Created on Fynda Idea | **1315** published, score **40**, tag `Idea Vault` |
| Follow-up same day | GLP-1 added so both sides are **1326**. All **1326** vault Link fields point at a live slug. Old research URLs kept in the page body. Set 1 bodies now include the Notion URL. |
| Catalog after | **1326** published |
| Notes | Long vault titles clipped to 180 chars; full text kept in the body with the Notion URL. Set 1 stays score 70 so it still ranks first. Notion Status not changed. |

### Idea Vault migration (2026-08-29)

| Field | Value |
|---|---|
| Source | Product Vault `Entry Type = Idea` |
| Dest | Idea Vault (`IDEA_VAULT_DATABASE_ID`) |
| Copied | **1183 / 1183** |
| Archived | **1183** (Product Vault originals) |
| Failed | **0** |
| Source after | Product Vault remaining Ideas = **0** |
| Notes | Schemas matched 1:1. `table` blocks skipped (Notion API). Market pages already in Market Vault (Sophie). |

---

## Canvas and personal idea workflow (2026-10-17)

- Nik selected **Canvas**. It is now the fixed page design; compare only the lower area using **Split**, **Panels**, and **Reading** (`body` URL parameter). No lower variation selected yet.
- **My status** is private to each authenticated account and stable idea ID. Options match Idea Vault’s verified 13 Status names, including `🔥Ready for build`. Untracked is the default. The dashboard has **My ideas** with stage filters and editing, plus a tracker preview on Home. These personal stages do not change catalog publication or other users’ stages, and are not automatically written to Notion.
- Admin edits open inline in the overview, key points, metadata, full details, and individual Markdown sections. Listing saves stay on the page, check revisions, preserve neighboring source, and enter the existing Notion sync queue. Failed drafts remain editable.
- Migration `44_user_idea_progress.sql` was explicitly approved and applied to the configured Fynda Idea database. No live catalog content or personal stages were changed by implementation/testing; integration fixtures and credential-free test identities rolled back.
- The existing admin access gate remains in effect. See `docs/idea-progress.md` for private tracking, API ownership and tests.

## App editing and Notion sync (2026-10-17)

- Individual idea pages have admin-only inline editing within their sections. Content saves update the timestamp and show **Updated — pending Notion sync**.
- On Nik’s request to sync, inspect the pending revision queue and reconcile app edits into Idea Vault, preserving existing research and newer Notion changes. Acknowledge only the verified revision after successful copying; concurrent edits must remain pending. See `docs/idea-notion-sync.md`. Manual app edits wait for a sync request; the standing capture-and-publish workflow remains synchronized as before.
- Migration `43_idea_notion_sync.sql` was explicitly approved and applied to Fynda Idea’s configured database; 1,344 existing ideas start at revision 0 with no content modifications.

## Preference changelog

| When | Change |
|---|---|
| 2026-10-17 | Canvas selected. Added lower-area variations, private Notion-matched personal stages/dashboard tracker, and inline edits for each listing section. Applied approved migration 44. Verified desktop/mobile down to 320px, failed-save recovery, stage persistence/clearing/filtering, account isolation, real RLS, revision conflicts, anonymous endpoint denials and production build. |
| 2026-10-17 | Nik rejected the initial three individual-page styles. Replaced them with Brief (compact product overview), Canvas (dark header and numbered highlights), and Workspace (document with real section links). Kept the comparison switcher, admin edit/sync actions and old layout URL compatibility. Checked desktop/mobile down to 320px, section targets, refresh selection, favorites, types/lint and production build. No final layout selected yet. |
| 2026-10-17 | Added list-card details previews and Editorial / Dossier / Focus individual-page variations with URL-persisted selection. Added verified-admin editing, return to the selected layout, and a durable revision queue for requested Notion syncs. Checked production build, lint/types, desktop/mobile component interactions, anonymous endpoint denials, and rollback-only database integration tests. |
| 2026-10-16 | Sort the Ideas directory by updated time descending, with favorites still first. Server pagination, client reordering, category idea lists, and MCP listings use newest updates first. The home page's explicitly highest-scored section retains score ordering. |
| 2026-10-16 | Captured Nik's 24 nonblank inputs as 15 new ideas + 8 enriched existing ideas on both surfaces; #13 attached to #10, #25 omitted. Standing instruction: always publish captures and keep Idea Vault in sync. |
| 2026-10-15 | Loading/favorites review: fixed collapsed shared shimmer fills and reduced-motion CSS precedence; added matching Ideas/auth/store skeletons and a layout loading boundary; removed the forced home splash delay. Seeded the Ideas favorite state from its server response, added optimistic animated reordering with rollback, serialized saves, and refreshed shared favorite state for subsequent navigation. Checked nine skeleton variants at desktop/mobile sizes and slow-auth, save/unsave, refresh, pagination, retry, and failed-save flows in an isolated component fixture; the real Ideas route remains behind its admin gate. |
| 2026-10-15 | Requested favorites first in the Fynda Idea directory. Implemented personal favorite ordering before pagination/search results, with refresh after toggles. Local verification passed; Nik authorized sync, commit, and push using this project's local Git credentials. |
| 2026-08-29 | **Mina** created — Idea Steward; Product Vault Ideas; Capture → Classify → Dedupe → Curate → Queue. Boundaries vs Ron (research) and Vera (pick) locked. |
| 2026-08-29 | System of record → **Idea Vault**. Migrated **1183/1183** Product Vault Ideas → Idea Vault; archived all sources. Script: `scripts/migrate_ideas_to_idea_vault.py`. |
| 2026-10-03 | **Ivy** removed — Fynda Idea Superhero folded into **Mina**. Mina owns Idea Vault + live Fynda Idea (`fynda-idea-prod.vercel.app`). |
| 2026-10-03 | Env aligned with **Atlas / Eden**: Fynda Idea first → named `IDEA_VAULT_DATABASE_ID` (dropped bare `NOTION_DATABASE_ID`). |
| 2026-10-03 | Trimmed env: removed Product Vault, Social Network Vault, and unused optional `MINA_*` defaults. Mina only needs Fynda Idea + Idea Vault. |
| 2026-10-03 | **Set 1 Consumer Companions** seeded: **10/10** published on Fynda Idea + Idea Vault dual-write (tags `Fynda Idea Ready` + `Set 1 Consumer Companions`). Canvas: `idea-data-plan.canvas.tsx`. |
| 2026-10-04 | Fleet-wide: **do not set Notion Status = Reviewed** unless Nik explicitly asks. |
| 2026-10-12 | Mina moved from `~/Desktop/Projects/aiagents/mina_ideasteward` into the Fynda Idea repo at `mina_aiagent/`. `idea-data-plan.canvas.tsx` now lives under this workspace's Cursor project (`Users-nikeshhvijayabaskaran-Desktop-Projects-Fynda-Fynda-Idea-fynda-idea/canvases`). Git pull/commit now targets fynda.idea. |
| 2026-10-15 | Full Idea Vault sync onto Fynda Idea, then closed the last gap: catalog **1326** = vault **1326**, every Link points at a live slug. |
