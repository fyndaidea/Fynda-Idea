import "server-only";

import { createHash, createHmac, timingSafeEqual } from "crypto";

const ACCESS_TTL_SEC = 60 * 60 * 24 * 30;

type AccessPayload = {
  sub: string;
  typ: "mcp_access" | "mcp_refresh";
  exp: number;
  /** Empty or missing = full MCP access. */
  perms?: string[];
};

function secret(): string {
  const value = process.env.MCP_OAUTH_SECRET?.trim();
  if (!value) {
    throw new Error("MCP_OAUTH_SECRET is not configured");
  }
  return value;
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function b64urlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(data: string): string {
  return createHmac("sha256", secret()).update(data).digest("base64url");
}

function issueToken(
  userId: string,
  typ: AccessPayload["typ"],
  ttlSec: number,
  mcpPermissions?: string[]
): string {
  const payload: AccessPayload = {
    sub: userId,
    typ,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
    ...(mcpPermissions?.length ? { perms: mcpPermissions } : {}),
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function issueMcpAccessToken(
  userId: string,
  mcpPermissions?: string[]
): string {
  return issueToken(userId, "mcp_access", ACCESS_TTL_SEC, mcpPermissions);
}

export function issueMcpRefreshToken(
  userId: string,
  mcpPermissions?: string[]
): string {
  return issueToken(userId, "mcp_refresh", ACCESS_TTL_SEC * 2, mcpPermissions);
}

export type VerifiedMcpToken = {
  userId: string;
  mcpPermissions: string[];
};

export function verifyMcpAccessToken(token: string): VerifiedMcpToken | null {
  return verifyTokenByType(token, "mcp_access");
}

export function verifyMcpRefreshToken(token: string): VerifiedMcpToken | null {
  return verifyTokenByType(token, "mcp_refresh");
}

function verifyTokenByType(
  token: string,
  typ: AccessPayload["typ"]
): VerifiedMcpToken | null {
  const i = token.lastIndexOf(".");
  if (i <= 0) return null;
  const body = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = sign(body);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }
  try {
    const payload = JSON.parse(b64urlDecode(body)) as AccessPayload;
    if (payload.typ !== typ) return null;
    if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      userId: payload.sub,
      mcpPermissions: payload.perms ?? [],
    };
  } catch {
    return null;
  }
}

type AuthCodePayload = {
  sub: string;
  typ: "mcp_code";
  exp: number;
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: "S256";
  perms?: string[];
};

export function issueMcpAuthCode(input: {
  userId: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  mcpPermissions?: string[];
}): string {
  const payload: AuthCodePayload = {
    sub: input.userId,
    typ: "mcp_code",
    exp: Math.floor(Date.now() / 1000) + 600,
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
    ...(input.mcpPermissions?.length ? { perms: input.mcpPermissions } : {}),
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function exchangeMcpAuthCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}): VerifiedMcpToken | null {
  const i = input.code.lastIndexOf(".");
  if (i <= 0) return null;
  const body = input.code.slice(0, i);
  const sig = input.code.slice(i + 1);
  const expected = sign(body);
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return null;
    }
  } catch {
    return null;
  }

  let payload: AuthCodePayload;
  try {
    payload = JSON.parse(b64urlDecode(body)) as AuthCodePayload;
  } catch {
    return null;
  }

  if (payload.typ !== "mcp_code") return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  if (payload.client_id !== input.clientId) return null;
  if (payload.redirect_uri !== input.redirectUri) return null;
  if (payload.code_challenge_method !== "S256") return null;

  const challenge = createHash("sha256")
    .update(input.codeVerifier)
    .digest("base64url");
  if (challenge !== payload.code_challenge) return null;

  return {
    userId: payload.sub,
    mcpPermissions: payload.perms ?? [],
  };
}
