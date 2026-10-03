import HomeBrandLoader from "@/components/brand/HomeBrandLoader";
import HomeCategoriesStrip from "@/components/home/HomeCategoriesStrip";
import HomeCollectionsStrip from "@/components/home/HomeCollectionsStrip";
import HomeHero from "@/components/home/HomeHero";
import HomeTopIdeasStrip from "@/components/home/HomeTopIdeasStrip";
import { countCategories } from "@/lib/db/categories-db";
import { countCollections } from "@/lib/db/collections-db";
import { getMarketingHomeData } from "@/lib/site-nav-visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const { ideaCount, heroIdeas } = await getMarketingHomeData();
  const [categoryCount, collectionCount] = await Promise.all([
    countCategories().catch(() => 0),
    countCollections().catch(() => 0),
  ]);

  return (
    <HomeBrandLoader>
      <main className="relative">
        <HomeHero
          ideaCount={ideaCount}
          categoryCount={categoryCount}
          collectionCount={collectionCount}
          ideas={heroIdeas}
        />
        <HomeCollectionsStrip />
        <HomeCategoriesStrip />
        <HomeTopIdeasStrip />
      </main>
    </HomeBrandLoader>
  );
}
