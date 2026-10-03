/** Canonical product display name for Fynda Idea. */
export const PRODUCT_NAME = "Fynda";
/** Wordmark fragment next to the F mark — reads as “Fynda”. */
export const PRODUCT_MARK_WORDMARK = "ynda";
export const PRODUCT_DOMAIN = "fynda.idea";
export const PRODUCT_SITE_URL = "https://fynda.idea";
export const PRODUCT_WORDMARK = "Fynda";
export const PRODUCT_TAGLINE =
  "A curated collection of startup and product ideas — discover, save, and submit the next thing worth building.";

/** Primary contact for the site (privacy, legal, sales, general). */
export const PRODUCT_CONTACT_EMAIL = "hello@fynda.idea";

export const PRODUCT_EMAIL = {
  hello: PRODUCT_CONTACT_EMAIL,
  privacy: PRODUCT_CONTACT_EMAIL,
  legal: PRODUCT_CONTACT_EMAIL,
  sales: PRODUCT_CONTACT_EMAIL,
} as const;
