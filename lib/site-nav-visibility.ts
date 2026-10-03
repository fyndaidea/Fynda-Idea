import { cache } from "react";
import { countCategories } from "@/lib/db/categories-db";
import { countCollections } from "@/lib/db/collections-db";
import { countIdeas, listIdeas } from "@/lib/db/ideas-db";

export type SiteNavVisibility = {
  showIdeas: boolean;
  showCategories: boolean;
  showCollections: boolean;
};

/** Lightweight flags for header nav (cached per request). */
export const getSiteNavVisibility = cache(async (): Promise<SiteNavVisibility> => {
  try {
    const [ideaCount, categoryCount, collectionCount] = await Promise.all([
      countIdeas(),
      countCategories(),
      countCollections(),
    ]);
    return {
      showIdeas: ideaCount > 0,
      showCategories: categoryCount > 0,
      showCollections: collectionCount > 0,
    };
  } catch {
    return {
      showIdeas: true,
      showCategories: true,
      showCollections: true,
    };
  }
});

export type MarketingHomeData = SiteNavVisibility & {
  ideaCount: number;
  heroIdeas: Awaited<ReturnType<typeof listIdeas>>;
};

/** Home page: visibility plus hero ideas when available. */
export const getMarketingHomeData = cache(async (): Promise<MarketingHomeData> => {
  const v = await getSiteNavVisibility();

  const [heroIdeas, ideaCount] = await Promise.all([
    listIdeas({ limit: 6, featuredOnly: true }).catch(() => [] as Awaited<ReturnType<typeof listIdeas>>),
    countIdeas().catch(() => 0),
  ]);

  return {
    ...v,
    ideaCount,
    heroIdeas: heroIdeas.length
      ? heroIdeas
      : await listIdeas({ limit: 6 }).catch(() => [] as Awaited<ReturnType<typeof listIdeas>>),
  };
});
