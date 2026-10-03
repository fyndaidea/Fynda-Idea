import { resolveApiKeyUser, isApiKeyToken } from "@/lib/auth/resolve-api-key";
import { ensureProfile } from "@/lib/db/profile";
import {
  createOAuthSession,
  signOAuthState,
  verifySignedOAuthState,
} from "@/lib/mcp/auth";
import { validateOAuthClient } from "@/lib/mcp/cimd";
import { mcpResourceUrl } from "@/lib/mcp/oauth-config";
import { MCP_DISPLAY_NAME, mcpIconDataUri } from "@/lib/mcp/branding";
import { issueMcpAuthCode } from "@/lib/mcp/oauth-tokens";

export const runtime = "nodejs";

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

function authorizeFormFields(input: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  oauthState: string;
}) {
  return `<input type="hidden" name="client_id" value="${escapeHtmlAttr(input.clientId)}" />
<input type="hidden" name="redirect_uri" value="${escapeHtmlAttr(input.redirectUri)}" />
<input type="hidden" name="code_challenge" value="${escapeHtmlAttr(input.codeChallenge)}" />
<input type="hidden" name="state" value="${escapeHtmlAttr(input.state)}" />
<input type="hidden" name="oauth_state" value="${escapeHtmlAttr(input.oauthState)}" />`;
}

function authorizeHtml(
  message?: string,
  clientName?: string,
  fields?: {
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    state: string;
    oauthState: string;
  }
) {
  const title = clientName ? `Connect Fynda to ${clientName}` : "Connect Fynda";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 420px; margin: 48px auto; padding: 0 16px; color: #111; }
    .brand { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .brand img { width: 40px; height: 40px; border-radius: 10px; }
    h1 { font-size: 1.25rem; margin: 0; }
    p { color: #444; line-height: 1.5; }
    label { display: block; font-weight: 600; margin-bottom: 6px; }
    input { width: 100%; padding: 10px 12px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
    button { margin-top: 16px; width: 100%; padding: 12px; background: #2563eb; color: #fff; border: 0; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .error { color: #b91c1c; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="brand">
    <img src="${escapeHtmlAttr(mcpIconDataUri())}" alt="${escapeHtmlAttr(MCP_DISPLAY_NAME)}" width="40" height="40" />
    <h1>${title}</h1>
  </div>
  <p>Paste the API key from <strong>Dashboard → API &amp; MCP</strong> in your Fynda Idea account. Your AI assistant will use it to access your account securely.</p>
  <form method="post">
    ${fields ? authorizeFormFields(fields) : ""}
    <label for="api_key">API key</label>
    <input id="api_key" name="api_key" type="password" autocomplete="off" placeholder="sk_live_…" required />
    ${message ? `<p class="error">${message}</p>` : ""}
    <button type="submit">Authorize</button>
  </form>
</body>
</html>`;
}

function resourceMatches(value: string | null): boolean {
  if (!value?.trim()) return true;
  return value.trim() === mcpResourceUrl();
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("client_id")?.trim();
  const redirectUri = url.searchParams.get("redirect_uri")?.trim();
  const codeChallenge = url.searchParams.get("code_challenge")?.trim();
  const state = url.searchParams.get("state")?.trim();
  const responseType = url.searchParams.get("response_type")?.trim();
  const resource = url.searchParams.get("resource");

  if (!clientId || !redirectUri || !codeChallenge || !state || responseType !== "code") {
    return new Response("Invalid OAuth authorize request", { status: 400 });
  }
  if (!resourceMatches(resource)) {
    return new Response("Invalid resource parameter", { status: 400 });
  }

  const client = await validateOAuthClient(clientId, redirectUri);
  if (!client.ok) {
    return new Response(`Invalid OAuth client: ${client.reason}`, { status: 400 });
  }

  const session = createOAuthSession({
    clientId,
    redirectUri,
    codeChallenge,
    state,
  });
  const signed = signOAuthState(session);

  const html = authorizeHtml(undefined, client.clientName, {
    clientId,
    redirectUri,
    codeChallenge,
    state,
    oauthState: signed,
  });

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(req: Request) {
  const form = await req.formData();
  const apiKey = String(form.get("api_key") ?? "").trim();
  const clientId = String(form.get("client_id") ?? "").trim();
  const redirectUri = String(form.get("redirect_uri") ?? "").trim();
  const codeChallenge = String(form.get("code_challenge") ?? "").trim();
  const state = String(form.get("state") ?? "").trim();
  const oauthState = String(form.get("oauth_state") ?? "").trim();

  const sessionFields =
    clientId && redirectUri && codeChallenge && state && oauthState
      ? { clientId, redirectUri, codeChallenge, state, oauthState }
      : undefined;

  const verifiedSession = verifySignedOAuthState(oauthState);
  if (!verifiedSession) {
    return new Response(
      authorizeHtml(
        "Session expired. Close this tab and connect again from your AI assistant.",
        undefined,
        sessionFields
      ),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (
    clientId !== verifiedSession.clientId ||
    redirectUri !== verifiedSession.redirectUri ||
    codeChallenge !== verifiedSession.codeChallenge ||
    state !== verifiedSession.state
  ) {
    return new Response(
      authorizeHtml(
        "Session mismatch. Close this tab and connect again from your AI assistant.",
        undefined,
        sessionFields
      ),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const client = await validateOAuthClient(clientId, redirectUri);
  if (!client.ok) {
    return new Response(
      authorizeHtml(
        "Invalid OAuth client. Connect again from your AI assistant.",
        undefined,
        sessionFields
      ),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  if (!isApiKeyToken(apiKey)) {
    return new Response(
      authorizeHtml("Enter a valid sk_live_… API key.", client.clientName, sessionFields),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const resolved = await resolveApiKeyUser(apiKey);
  if (!resolved || !(await ensureProfile(resolved.userId))) {
    return new Response(
      authorizeHtml(
        "Invalid API key.",
        client.clientName,
        sessionFields
      ),
      { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const code = issueMcpAuthCode({
    userId: resolved.userId,
    clientId,
    redirectUri,
    codeChallenge,
    mcpPermissions: resolved.mcpPermissions,
  });

  const target = new URL(redirectUri);
  target.searchParams.set("code", code);
  target.searchParams.set("state", state);
  return Response.redirect(target.toString(), 302);
}
