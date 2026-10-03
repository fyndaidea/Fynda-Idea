import "server-only";

import { getPublicOrigin } from "mcp-handler";

/** Public origin for MCP/OAuth metadata (respects Vercel proxy headers). */
export function getAppOrigin(req: Request): string {
  return getPublicOrigin(req);
}

export function getAppUrl(req: Request, pathname: string): string {
  const origin = getAppOrigin(req);
  return `${origin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}
