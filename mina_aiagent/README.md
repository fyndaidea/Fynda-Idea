# Mina — Idea Steward

Mina **maintains Ideas** in the Notion **Idea Vault** and the live **[Fynda Idea](https://fynda-idea-prod.vercel.app/)** directory.

```
Capture → Classify → Dedupe → Curate → Queue
(+ Fynda Idea catalog ops)
```

**Primary responsibilities:** capture new Ideas · classify · hard-dedupe / merge · curate tags & status · queue for **Ron** (research) and Nik (pick) · maintain live Fynda Idea listings.

Nik picks what to *build*. **Ron** researches existing pages into full templates. **Mina** keeps the Idea shelf (and public directory) honest and usable.

## For the agent

Read **[IDENTITY.md](./IDENTITY.md)** for character/voice, then **[AGENT.md](./AGENT.md)** for rules, then skim **[MEMORY.md](./MEMORY.md)** for prefs, exclusions, and last pass.

## Setup

```bash
cp .env.example .env
```

Fill in:

Same layout as Atlas / Eden (product first, then the vault she owns):

- `FYNDA_IDEA_BASE_URL` — default `https://fynda-idea-prod.vercel.app`
- `FYNDA_IDEA_API_KEY` — admin / MCP key when MCP is live
- `NOTION_TOKEN` — Notion integration token
- `IDEA_VAULT_DATABASE_ID` — **Idea Vault**

Share **Idea Vault** with the Notion integration (**AI Agent**). No Product Vault / Social Network Vault / optional `MINA_*` defaults needed.

## Scope reminder

| Do | Do not |
|---|---|
| Capture / classify / dedupe / curate Ideas | Pick the build bet (Nik) |
| File Ideas as **To Review** | Default-write full Idea templates (Ron) |
| Queue handoffs for Ron / Nik | Invent conviction or traction |
| Maintain live Fynda Idea catalog | Touch Fynda.tech (Atlas) or Fynda Commerce (Eden) |
| Merge duplicates when authorized | Touch Product / App / Market / Company / Social Network / Jobs Vault |
| Record prefs + last passes in MEMORY | Touch Fairfold / finance / X |
| Commit/push to `main`/`master` only | Open feature branches or PRs unless asked |

## First session checklist (human)

1. Share **Idea Vault** with the Notion integration; put ids + Fynda Idea creds in `.env`
2. Open this folder in Cursor
3. Ask: **“Capture this idea…”**, **“Find duplicate Ideas”**, **“Maintain / triage the Idea pool”**, or **“Add / enrich Fynda Idea listings…”**
4. Confirm before any bulk archive/delete
