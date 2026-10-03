Fynda Idea exposes a production **Model Context Protocol** server so assistants (e.g. Claude) can search and manage the ideas catalog.

## Endpoints

| Route | Purpose |
|-------|---------|
| `/api/mcp/[transport]` | MCP HTTP transport (GET/POST/DELETE) |
| `/api/mcp/.well-known/oauth-protected-resource` | OAuth protected resource metadata |
| `/api/mcp/oauth/.well-known/oauth-authorization-server` | Authorization server metadata |
| `/api/mcp/oauth/.well-known/openid-configuration` | OIDC discovery |
| `/api/mcp/oauth/register` | Dynamic client registration |
| `/api/mcp/oauth/authorize` | Authorization |
| `/api/mcp/oauth/token` | Token exchange |
| `/.well-known/oauth-authorization-server` | Host-root AS discovery alias |
| `/.well-known/openid-configuration` | Host-root OIDC discovery alias |
| `/.well-known/oauth-protected-resource` | Host-root protected-resource alias |

Implementation: `app/api/mcp/`, `lib/mcp/*`. Runtime: Node.js, `maxDuration` 60s.

## Authentication

1. **API key** — create in Dashboard → API & MCP. Send `X-API-Key` or `Authorization: Bearer sk_live_…`. Stored hashed in `user_api_keys`.
2. **OAuth** — for web connectors; requires `MCP_OAUTH_SECRET`.

Most tools require a signed-in user profile. Create/update/delete catalog tools require **admin**.

## Permissions

Granular scopes on each key (`lib/mcp/permissions.ts`). Empty `mcp_permissions` = full access.

| Permission | Tools |
|------------|-------|
| `ideas:read` | `list_ideas`, `search_ideas`, `get_idea`, `list_categories`, `list_collections` |
| `ideas:write` | `create_idea`, `update_idea`, `delete_idea`, `create_category`, `update_category`, `delete_category`, `create_collection`, `update_collection`, `delete_collection`, `list_submissions` (admin) |
| `favorites:read` / `favorites:write` | `list_favorites`, `add_favorite`, `remove_favorite` |
| `submissions:write` | `submit_idea` |

## Registered tools

| Tool | Access |
|------|--------|
| `list_ideas`, `search_ideas`, `get_idea` | Signed-in |
| `list_categories`, `list_collections` | Signed-in |
| `list_favorites`, `add_favorite`, `remove_favorite` | Signed-in |
| `submit_idea` | Signed-in |
| `create_idea`, `update_idea`, `delete_idea` | Admin |
| `create_category`, `update_category`, `delete_category` | Admin |
| `create_collection`, `update_collection`, `delete_collection` | Admin |
| `list_submissions` | Admin |

## User-facing setup

Documented for end users in [MCP & API keys](/docs/mcp). Operators configure `MCP_OAUTH_SECRET`.
