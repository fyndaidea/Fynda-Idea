/** MCP is reserved for admins; subscription state and token scopes cannot grant it. */
export function canUseMcp(role: string | null | undefined): boolean {
  return role === "admin";
}

export function visibleMcpSection<T extends string>(section: T, role: string | null | undefined, home: T): T {
  return section === "api" && !canUseMcp(role) ? home : section;
}

/** Reload the server profile on every check, including use of previously issued tokens. */
export async function checkMcpAdmin(
  userId: string,
  loadProfile: (id: string) => Promise<{ role?: string | null } | null | undefined>
): Promise<boolean> {
  if (!userId) return false;
  return canUseMcp((await loadProfile(userId))?.role);
}
