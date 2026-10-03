import {
  issueMcpAccessToken,
  issueMcpRefreshToken,
  exchangeMcpAuthCode,
  verifyMcpRefreshToken,
} from "@/lib/mcp/oauth-tokens";
import { mcpResourceUrl, oauthJsonResponse, oauthMetadataCorsHeaders } from "@/lib/mcp/oauth-config";

export const runtime = "nodejs";

async function parseBody(req: Request): Promise<Record<string, string>> {
  const contentType = req.headers.get("content-type") ?? "";
  const body: Record<string, string> = {};

  if (contentType.includes("application/json")) {
    const json = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (json) {
      for (const [k, v] of Object.entries(json)) {
        if (typeof v === "string") body[k] = v;
      }
    }
  } else {
    const form = await req.formData();
    for (const [k, v] of form.entries()) {
      if (typeof v === "string") body[k] = v;
    }
  }
  return body;
}

function resourceMatches(body: Record<string, string>): boolean {
  const resource = body.resource?.trim();
  if (!resource) return true;
  return resource === mcpResourceUrl();
}

function tokenResponse(userId: string, mcpPermissions: string[] = []) {
  const accessToken = issueMcpAccessToken(userId, mcpPermissions);
  const refreshToken = issueMcpRefreshToken(userId, mcpPermissions);
  return oauthJsonResponse({
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: 60 * 60 * 24 * 30,
    refresh_token: refreshToken,
    scope: mcpPermissions.length ? mcpPermissions.join(" ") : "mcp",
  });
}

export async function POST(req: Request) {
  const body = await parseBody(req);

  if (!resourceMatches(body)) {
    return oauthJsonResponse({ error: "invalid_target" }, { status: 400 });
  }

  const grantType = body.grant_type?.trim();
  if (grantType === "authorization_code") {
    const code = body.code?.trim();
    const clientId = body.client_id?.trim();
    const redirectUri = body.redirect_uri?.trim();
    const codeVerifier = body.code_verifier?.trim();
    if (!code || !clientId || !redirectUri || !codeVerifier) {
      return oauthJsonResponse({ error: "invalid_request" }, { status: 400 });
    }
    const exchanged = exchangeMcpAuthCode({
      code,
      clientId,
      redirectUri,
      codeVerifier,
    });
    if (!exchanged) {
      return oauthJsonResponse({ error: "invalid_grant" }, { status: 400 });
    }
    return tokenResponse(exchanged.userId, exchanged.mcpPermissions);
  }

  if (grantType === "refresh_token") {
    const refresh = body.refresh_token?.trim();
    if (!refresh) {
      return oauthJsonResponse({ error: "invalid_request" }, { status: 400 });
    }
    const refreshed = verifyMcpRefreshToken(refresh);
    if (!refreshed) {
      return oauthJsonResponse({ error: "invalid_grant" }, { status: 400 });
    }
    return tokenResponse(refreshed.userId, refreshed.mcpPermissions);
  }

  return oauthJsonResponse({ error: "unsupported_grant_type" }, { status: 400 });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: oauthMetadataCorsHeaders });
}
