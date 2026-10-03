import "server-only";

export {
  buildProtectedResourceMetadata,
  mcpAuthResourceOrigin,
  mcpProtectedResourceMetadataPath,
  oauthMetadataCorsHeaders,
  oauthJsonResponse,
  mcpResourceUrl,
  mcpAuthIssuer,
} from "@/lib/mcp/oauth-config";

import { mcpAuthIssuer, mcpResourceUrl } from "@/lib/mcp/oauth-config";

export function publicAppOrigin(): string | undefined {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return url ? url.replace(/\/$/, "") : undefined;
}

/** @deprecated Use mcpResourceUrl() from oauth-config. */
export function getMcpResourceIdentifier(_req?: Request): string {
  return mcpResourceUrl();
}

/** @deprecated Use mcpAuthIssuer() from oauth-config. */
export function getMcpAuthServerIssuer(_req?: Request): string {
  return mcpAuthIssuer();
}
