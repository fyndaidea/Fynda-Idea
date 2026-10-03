import { buildAuthServerMetadata, oauthJsonResponse, oauthMetadataCorsHeaders } from "@/lib/mcp/oauth-config";

export const runtime = "nodejs";

/** Root discovery alias — Claude probes /.well-known/oauth-authorization-server on the MCP host. */
export async function GET() {
  return oauthJsonResponse(buildAuthServerMetadata());
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...oauthMetadataCorsHeaders,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}
