import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { isApiKeyToken, resolveApiKeyUser } from "@/lib/auth/resolve-api-key";
import { ensureProfile } from "@/lib/db/profile";
import { getAppOrigin } from "@/lib/mcp/origin";
import {
  issueMcpAccessToken,
  verifyMcpAccessToken,
} from "@/lib/mcp/oauth-tokens";

function readBearer(req: Request, bearerToken?: string): string | null {
  if (bearerToken?.trim()) return bearerToken.trim();
  const header = req.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7).trim() || null;
}

async function authInfoForUserId(
  token: string,
  userId: string,
  clientId: string,
  mcpPermissions: string[] = []
): Promise<AuthInfo | undefined> {
  const profile = await ensureProfile(userId);
  if (!profile) return undefined;
  return {
    token,
    clientId,
    scopes: mcpPermissions.length ? mcpPermissions : ["mcp"],
    extra: { userId, mcpPermissions },
  };
}

/** Validates API keys (`sk_live_…`) and MCP OAuth access tokens for remote connectors. */
export async function verifyMcpToken(
  req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> {
  const apiKeyHeader = req.headers.get("X-API-Key")?.trim();
  const token = apiKeyHeader || readBearer(req, bearerToken);
  if (!token) return undefined;

  if (isApiKeyToken(token)) {
    const resolved = await resolveApiKeyUser(token);
    if (!resolved) return undefined;
    return authInfoForUserId(
      token,
      resolved.userId,
      "api-key",
      resolved.mcpPermissions
    );
  }

  const oauth = verifyMcpAccessToken(token);
  if (!oauth) return undefined;
  return authInfoForUserId(
    token,
    oauth.userId,
    "oauth",
    oauth.mcpPermissions
  );
}

export function getMcpResourceUrl(req: Request): string {
  const origin = getAppOrigin(req);
  return `${origin}/api/mcp`;
}

export function getMcpAuthServerUrl(req: Request): string {
  const origin = getAppOrigin(req);
  return `${origin}/api/mcp/oauth`;
}

export function createOAuthState(): string {
  return randomBytes(24).toString("base64url");
}

function b64urlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function b64urlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

export type OAuthSessionPayload = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  nonce: string;
  exp: number;
};

export function createOAuthSession(input: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
}): OAuthSessionPayload {
  return {
    ...input,
    nonce: createOAuthState(),
    exp: Math.floor(Date.now() / 1000) + 60 * 30,
  };
}

export function signOAuthState(payload: OAuthSessionPayload): string {
  const secret = process.env.MCP_OAUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("MCP_OAUTH_SECRET is not configured");
  }
  const body = b64urlEncode(JSON.stringify(payload));
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySignedOAuthState(state: string): OAuthSessionPayload | null {
  const secret = process.env.MCP_OAUTH_SECRET?.trim();
  if (!secret) return null;
  const i = state.lastIndexOf(".");
  if (i <= 0) return null;
  const body = state.slice(0, i);
  const sig = state.slice(i + 1);
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(b64urlDecode(body)) as OAuthSessionPayload;
    if (
      !payload.clientId ||
      !payload.redirectUri ||
      !payload.codeChallenge ||
      !payload.state ||
      !payload.nonce ||
      !payload.exp
    ) {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export { issueMcpAccessToken };
