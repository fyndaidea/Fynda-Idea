import "server-only";

import { LOGO_MARK_SVG_DATA_URI } from "@/lib/brand/logo-mark";
import { PRODUCT_NAME, PRODUCT_TAGLINE } from "@/lib/brand/product";
import { canonicalOrigin } from "@/lib/mcp/oauth-config";

export const MCP_DISPLAY_NAME = PRODUCT_NAME;

/** Inline SVG so MCP clients need not fetch an external URL (OAuth page, Claude connectors). */
export function mcpIconDataUri(): string {
  return LOGO_MARK_SVG_DATA_URI;
}

export function mcpServerInfo() {
  const origin = canonicalOrigin();
  const dataUri = mcpIconDataUri();
  return {
    name: "fynda-idea",
    version: "1.0.0",
    title: MCP_DISPLAY_NAME,
    description:
      "Browse ideas, manage favorites, submit ideas, and (for admins) create or update the ideas catalog from your AI assistant. " +
      PRODUCT_TAGLINE,
    websiteUrl: origin,
    icons: [
      {
        src: dataUri,
        mimeType: "image/svg+xml",
        sizes: ["any"],
      },
      {
        src: `${origin}/apple-icon`,
        mimeType: "image/png",
        sizes: ["180x180"],
      },
    ],
  };
}
