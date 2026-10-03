import type { MetadataRoute } from "next";
import { PRODUCT_SITE_URL } from "@/lib/brand/product";
import { listCategories } from "@/lib/db/categories-db";
import { listCollections } from "@/lib/db/collections-db";
import { listIdeas } from "@/lib/db/ideas-db";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || PRODUCT_SITE_URL).replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/ideas",
    "/categories",
    "/collections",
    "/submit",
    "/feedback",
    "/docs",
    "/privacy",
    "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const [ideas, categories, collections] = await Promise.all([
      listIdeas({ limit: 2000 }),
      listCategories(),
      listCollections(),
    ]);

    return [
      ...staticRoutes,
      ...ideas.map((idea) => ({
        url: `${base}/ideas/${idea.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
      ...categories.map((cat) => ({
        url: `${base}/categories/${cat.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
      ...collections.map((col) => ({
        url: `${base}/collections/${col.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
