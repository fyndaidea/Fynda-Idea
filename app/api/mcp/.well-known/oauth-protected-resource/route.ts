import { metadataCorsOptionsRequestHandler } from "mcp-handler";
import { buildProtectedResourceMetadata, oauthJsonResponse } from "@/lib/mcp/oauth-config";

export const runtime = "nodejs";

/** Legacy alias for clients that received the old WWW-Authenticate metadata URL. */
export async function GET() {
  return oauthJsonResponse(buildProtectedResourceMetadata());
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
