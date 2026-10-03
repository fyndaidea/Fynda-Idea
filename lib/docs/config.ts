/** When true, `/docs/admin/*` is reachable and admin docs appear in the docs sidebar. */
export function showAdminDocs(): boolean {
  return process.env.SHOW_ADMIN_DOCS?.toLowerCase() === "true";
}
