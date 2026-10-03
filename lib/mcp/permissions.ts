/** Granular MCP permissions mapped to individual tools. */
export const MCP_PERMISSIONS = [
  "ideas:read",
  "ideas:write",
  "favorites:read",
  "favorites:write",
  "submissions:write",
] as const;

export type McpPermission = (typeof MCP_PERMISSIONS)[number];

export const MCP_TOOL_PERMISSIONS: Record<string, McpPermission> = {
  list_ideas: "ideas:read",
  search_ideas: "ideas:read",
  get_idea: "ideas:read",
  list_categories: "ideas:read",
  list_collections: "ideas:read",
  create_idea: "ideas:write",
  update_idea: "ideas:write",
  delete_idea: "ideas:write",
  create_category: "ideas:write",
  update_category: "ideas:write",
  delete_category: "ideas:write",
  create_collection: "ideas:write",
  update_collection: "ideas:write",
  delete_collection: "ideas:write",
  list_submissions: "ideas:write",
  list_favorites: "favorites:read",
  add_favorite: "favorites:write",
  remove_favorite: "favorites:write",
  submit_idea: "submissions:write",
};

export const MCP_READ_PERMISSIONS: McpPermission[] = MCP_PERMISSIONS.filter((p) =>
  p.endsWith(":read")
);

/** Empty or missing list means full access (legacy keys and "full access" preset). */
export function hasMcpPermission(
  granted: readonly string[] | null | undefined,
  required: McpPermission
): boolean {
  if (!granted?.length) return true;
  return granted.includes(required);
}

export function normalizeMcpPermissions(
  input: unknown
): McpPermission[] | null {
  if (!Array.isArray(input)) return null;
  const valid = input.filter(
    (p): p is McpPermission =>
      typeof p === "string" &&
      (MCP_PERMISSIONS as readonly string[]).includes(p)
  );
  return valid.length ? [...new Set(valid)] : [];
}

export function mcpPermissionLabel(permission: McpPermission): string {
  const labels: Record<McpPermission, string> = {
    "ideas:read": "Browse & search ideas, categories, and collections",
    "ideas:write": "Create, update, and delete ideas, categories, and collections (admin)",
    "favorites:read": "List favorites",
    "favorites:write": "Add & remove favorites",
    "submissions:write": "Submit new ideas",
  };
  return labels[permission];
}
