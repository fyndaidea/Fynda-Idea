import { randomBytes } from "crypto";
import {
  mcpAuthIssuer,
  mcpLogoUrl,
  oauthJsonResponse,
  oauthMetadataCorsHeaders,
} from "@/lib/mcp/oauth-config";
import { MCP_DISPLAY_NAME } from "@/lib/mcp/branding";

export const runtime = "nodejs";

type RegisterBody = {
  redirect_uris?: unknown;
  client_name?: unknown;
  grant_types?: unknown;
  response_types?: unknown;
  token_endpoint_auth_method?: unknown;
  scope?: unknown;
  application_type?: unknown;
};

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((u): u is string => typeof u === "string");
}

function registrationResponse(body: RegisterBody, clientId: string) {
  const redirectUris = parseStringArray(body.redirect_uris);
  const grantTypes = parseStringArray(body.grant_types);
  const responseTypes = parseStringArray(body.response_types);
  const authMethod =
    typeof body.token_endpoint_auth_method === "string"
      ? body.token_endpoint_auth_method
      : "none";

  return {
    client_id: clientId,
    client_id_issued_at: Math.floor(Date.now() / 1000),
    client_secret_expires_at: 0,
    grant_types: grantTypes.length ? grantTypes : ["authorization_code", "refresh_token"],
    response_types: responseTypes.length ? responseTypes : ["code"],
    token_endpoint_auth_method: authMethod === "client_secret_post" ? "none" : authMethod,
    redirect_uris: redirectUris,
    logo_uri: mcpLogoUrl(),
    client_name:
      typeof body.client_name === "string" ? body.client_name : MCP_DISPLAY_NAME,
    ...(typeof body.scope === "string" ? { scope: body.scope } : {}),
    ...(typeof body.application_type === "string"
      ? { application_type: body.application_type }
      : {}),
  };
}

export async function GET() {
  return oauthJsonResponse({
    registration_endpoint: `${mcpAuthIssuer()}/register`,
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as RegisterBody | null;
  const redirectUris = parseStringArray(body?.redirect_uris);

  if (!redirectUris.length) {
    return oauthJsonResponse(
      { error: "invalid_client_metadata", error_description: "redirect_uris required" },
      { status: 400 }
    );
  }

  const clientId = randomBytes(16).toString("hex");
  return oauthJsonResponse(registrationResponse(body ?? {}, clientId), { status: 201 });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: oauthMetadataCorsHeaders });
}
