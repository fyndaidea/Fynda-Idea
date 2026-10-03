import {
  createMcpHandler,
  withMcpAuth,
} from "mcp-handler";
import { registerFyndaMcpTools } from "@/lib/mcp/register-tools";
import { mcpServerInfo } from "@/lib/mcp/branding";
import { verifyMcpToken } from "@/lib/mcp/auth";
import { runWithMcpContext } from "@/lib/mcp/context";
import { mcpAuthResourceOrigin, mcpProtectedResourceMetadataPath } from "@/lib/mcp/oauth-metadata";

export const runtime = "nodejs";
export const maxDuration = 60;

const mcpHandler = createMcpHandler(
  (server) => {
    registerFyndaMcpTools(server);
  },
  {
    serverInfo: mcpServerInfo(),
  },
  {
    basePath: "/api/mcp",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
  }
);

const authenticatedMcp = withMcpAuth(
  (req) => {
    const userId = req.auth?.extra?.userId;
    if (typeof userId !== "string" || !userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const rawPerms = req.auth?.extra?.mcpPermissions;
    const mcpPermissions = Array.isArray(rawPerms)
      ? rawPerms.filter((p): p is string => typeof p === "string")
      : [];
    return runWithMcpContext({ userId, mcpPermissions }, () => mcpHandler(req));
  },
  verifyMcpToken,
  {
    required: true,
    resourceUrl: mcpAuthResourceOrigin(),
    resourceMetadataPath: mcpProtectedResourceMetadataPath(),
  }
);

export { authenticatedMcp as GET, authenticatedMcp as POST, authenticatedMcp as DELETE };
