import HomeBrandLoader from "@/components/brand/HomeBrandLoader";
import HomeCategoriesStrip from "@/components/home/HomeCategoriesStrip";
import HomeCollectionsStrip from "@/components/home/HomeCollectionsStrip";
import HomeFeaturedIdeasStrip from "@/components/home/HomeFeaturedIdeasStrip";
import HomeHero from "@/components/home/HomeHero";
import { getMarketingHomeData } from "@/lib/site-nav-visibility";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function Home() {
  const { ideaCount, heroIdeas } = await getMarketingHomeData();

  return (
    <HomeBrandLoader>
      <main className="relative">
        <HomeHero ideaCount={ideaCount} />
        <HomeFeaturedIdeasStrip ideas={heroIdeas} />
        <HomeCategoriesStrip />
        <HomeCollectionsStrip />
      </main>
    </HomeBrandLoader>
  );
}
