import { buildAuthServerMetadata, oauthJsonResponse, oauthMetadataCorsHeaders } from "@/lib/mcp/oauth-config";

export const runtime = "nodejs";

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
