MCP (Model Context Protocol) lets AI assistants like Claude browse and act on the Fynda Idea catalog using your account.

## Prerequisites

1. A Fynda Idea account (sign in)
2. An API key from [Dashboard](/docs/dashboard) → API & MCP

## Create an API key

1. Sign in and open the dashboard.
2. Go to the **API & MCP** tab.
3. Create a key, optionally limiting permissions (browse ideas, favorites, submissions, etc.).
4. Copy the key once — it is shown only at creation time.

## Connect a client

- **API key auth:** configure your MCP client with the Fynda Idea MCP URL (`/api/mcp/mcp`) and your key (`X-API-Key` or Bearer `sk_live_…`).
- **OAuth (Claude.ai-style):** use the site’s OAuth discovery endpoints under `/api/mcp/…` when enabled by the operator (`MCP_OAUTH_SECRET`).

Exact connector UI varies by client; ask your operator for the production base URL (same as `NEXT_PUBLIC_APP_URL`).

## What you can do

Typical tools include listing/searching ideas, managing favorites, and submitting ideas. Creating, updating, or deleting live catalog entries (ideas, categories, collections) is reserved for **admins**.

## Related

- [Dashboard](/docs/dashboard)
