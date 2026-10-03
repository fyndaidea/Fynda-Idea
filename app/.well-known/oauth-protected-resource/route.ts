import { metadataCorsOptionsRequestHandler } from "mcp-handler";
import {
  buildProtectedResourceMetadata,
  oauthJsonResponse,
} from "@/lib/mcp/oauth-config";

export const runtime = "nodejs";

export async function GET() {
  return oauthJsonResponse(buildProtectedResourceMetadata());
}

export const OPTIONS = metadataCorsOptionsRequestHandler();
