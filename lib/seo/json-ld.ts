import { PRODUCT_NAME, PRODUCT_SITE_URL, PRODUCT_WORDMARK } from "@/lib/brand/product";

type Crumb = { name: string; path?: string };

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, PRODUCT_SITE_URL).toString();
}

export function breadcrumbJsonLd(items: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path ? { item: absoluteUrl(item.path) } : {}),
    })),
  };
}

export function collectionPageJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description || undefined,
    url: absoluteUrl(input.path),
    isPartOf: {
      "@type": "WebSite",
      name: PRODUCT_WORDMARK,
      url: PRODUCT_SITE_URL,
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: PRODUCT_WORDMARK,
    alternateName: PRODUCT_NAME,
    url: PRODUCT_SITE_URL,
  };
}

export function softwareApplicationJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  category?: string | null;
  image?: string | null;
  operatingSystem?: string;
  applicationCategory?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description || undefined,
    url: absoluteUrl(input.path),
    image: input.image || undefined,
    applicationCategory: input.applicationCategory || input.category || undefined,
    operatingSystem: input.operatingSystem || "Web",
  };
}

export function articleJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  datePublished?: Date | string | null;
  dateModified?: Date | string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.name,
    description: input.description || undefined,
    url: absoluteUrl(input.path),
    datePublished: input.datePublished
      ? new Date(input.datePublished).toISOString()
      : undefined,
    dateModified: input.dateModified
      ? new Date(input.dateModified).toISOString()
      : undefined,
    isPartOf: {
      "@type": "WebSite",
      name: PRODUCT_WORDMARK,
      url: PRODUCT_SITE_URL,
    },
  };
}

export function organizationJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  url?: string | null;
  logo?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: input.name,
    description: input.description || undefined,
    url: input.url || absoluteUrl(input.path),
    logo: input.logo || undefined,
    sameAs: input.url ? [input.url] : undefined,
  };
}

export function personJsonLd(input: {
  name: string;
  description?: string | null;
  path: string;
  url?: string | null;
  image?: string | null;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    description: input.description || undefined,
    url: absoluteUrl(input.path),
    image: input.image || undefined,
    sameAs: input.sameAs?.length ? input.sameAs : input.url ? [input.url] : undefined,
  };
}
