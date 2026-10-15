import "server-only";
import { getProfileById } from "@/lib/db/profile";
import { checkMcpAdmin } from "@/lib/mcp/access-policy";

export async function userCanAccessMcp(userId: string): Promise<boolean> {
  return checkMcpAdmin(userId, getProfileById);
}
