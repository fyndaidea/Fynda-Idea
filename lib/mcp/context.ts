import "server-only";

import { AsyncLocalStorage } from "async_hooks";
import {
  hasMcpPermission,
  MCP_TOOL_PERMISSIONS,
  type McpPermission,
} from "@/lib/mcp/permissions";

export type McpRequestContext = {
  userId: string;
  /** Empty = full access (legacy keys and OAuth without scoped permissions). */
  mcpPermissions?: string[];
};

const storage = new AsyncLocalStorage<McpRequestContext>();

export function runWithMcpContext<T>(ctx: McpRequestContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

export function getMcpUserId(): string {
  const ctx = storage.getStore();
  if (!ctx?.userId) {
    throw new Error("MCP authentication context is missing");
  }
  return ctx.userId;
}

export function getMcpPermissions(): string[] {
  return storage.getStore()?.mcpPermissions ?? [];
}

export function requireMcpToolAccess(toolName: string): void {
  const required = MCP_TOOL_PERMISSIONS[toolName];
  if (!required) return;
  if (!hasMcpPermission(getMcpPermissions(), required)) {
    throw new Error(`API key lacks MCP permission: ${required}`);
  }
}

export function requireMcpPermission(permission: McpPermission): void {
  if (!hasMcpPermission(getMcpPermissions(), permission)) {
    throw new Error(`API key lacks MCP permission: ${permission}`);
  }
}

/** Ensures a profile exists for the MCP user (no subscription gate on Idea). */
export async function requireMcpSubscription(userId: string): Promise<void> {
  const { ensureProfile } = await import("@/lib/db/profile");
  const profile = await ensureProfile(userId);
  if (!profile) {
    throw new Error("User profile required");
  }
}

/** Catalog create/update/delete requires an admin profile. */
export async function requireMcpAdmin(userId: string): Promise<void> {
  const { getDb } = await import("@/lib/db");
  const { isAdminRole } = await import("@/lib/auth/roles");
  const profile = await getDb()
    .selectFrom("profiles")
    .select("role")
    .where("id", "=", userId)
    .executeTakeFirst();
  if (!isAdminRole(profile?.role)) {
    throw new Error("Admin access required to create or update ideas");
  }
}
