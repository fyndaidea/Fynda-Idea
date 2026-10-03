/** Single source of truth for the Fynda.tech mark (favicon, OG icons, UI, MCP). */

export const BRAND_ACCENT = "#ff3131";

/** Architectural “F” elevation — floor plates on a brand square. */
export const LOGO_MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" role="img" aria-label="Fynda">
  <rect width="32" height="32" rx="9" fill="${BRAND_ACCENT}"/>
  <path d="M10 8.5h12.5M10 8.5v15M10 15.5h9.5" stroke="#fff" stroke-width="2.4" stroke-linecap="square" stroke-linejoin="miter"/>
  <path d="M22.5 7.2v2.6M7.5 24.5h5" stroke="#fff" stroke-width="1" stroke-linecap="square" opacity="0.55"/>
</svg>`;

export const LOGO_MARK_SVG_DATA_URI = `data:image/svg+xml,${encodeURIComponent(LOGO_MARK_SVG)}`;
