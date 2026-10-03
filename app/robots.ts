import type { MetadataRoute } from "next";
import { PRODUCT_SITE_URL } from "@/lib/brand/product";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/dashboard"],
    },
    sitemap: new URL("/sitemap.xml", PRODUCT_SITE_URL).toString(),
    host: PRODUCT_SITE_URL,
  };
}
