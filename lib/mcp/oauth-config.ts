import "server-only";

import { generateProtectedResourceMetadata } from "mcp-handler";
import { MCP_DISPLAY_NAME } from "@/lib/mcp/branding";

/** Canonical public origin — must match the connector URL host. */
export function canonicalOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

export function mcpResourceUrl(): string {
  return `${canonicalOrigin()}/api/mcp/mcp`;
}

export function mcpAuthIssuer(): string {
  return `${canonicalOrigin()}/api/mcp/oauth`;
}

export function mcpProtectedResourceMetadataPath(): string {
  return "/.well-known/oauth-protected-resource/api/mcp/mcp";
}

export function mcpAuthResourceOrigin(): string {
  return canonicalOrigin();
}

/** Public logo URL for OAuth metadata and MCP serverInfo (Claude connector list). */
export function mcpLogoUrl(): string {
  return `${canonicalOrigin()}/apple-icon`;
}

export function buildAuthServerMetadata() {
  const base = mcpAuthIssuer();
  return {
    issuer: base,
    authorization_endpoint: `${base}/authorize`,
    token_endpoint: `${base}/token`,
    registration_endpoint: `${base}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    client_id_metadata_document_supported: true,
    scopes_supported: ["mcp", "offline_access"],
    logo_uri: mcpLogoUrl(),
    service_documentation: `${canonicalOrigin()}/docs`,
  };
}

export function buildProtectedResourceMetadata() {
  return generateProtectedResourceMetadata({
    authServerUrls: [mcpAuthIssuer()],
    resourceUrl: mcpResourceUrl(),
    additionalMetadata: {
      bearer_methods_supported: ["header"],
      scopes_supported: ["mcp"],
      resource_name: MCP_DISPLAY_NAME,
      resource_documentation: `${canonicalOrigin()}/docs`,
    },
  });
}

export const oauthMetadataCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
} as const;

export function oauthJsonResponse(body: unknown, init?: ResponseInit): Response {
  return Response.json(body, {
    ...init,
    headers: {
      ...oauthMetadataCorsHeaders,
      "Cache-Control": "max-age=3600",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}
