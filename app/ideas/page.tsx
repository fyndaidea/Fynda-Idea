import { IdeasHubBrowser } from "@/components/directory/IdeasHubBrowser";
import { listIdeas, countIdeas } from "@/lib/db/ideas-db";
import { pageDescClass, pageTitleClass } from "@/lib/ui-classes";
import { headers } from "next/headers";
import { getApiUser } from "@/lib/auth/get-api-user";
import { getProfileFavorites } from "@/lib/favorites/store";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Ideas",
  description: "Browse curated startup and product ideas on Fynda Idea.",
};

const PAGE_SIZE = 24;

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const page = Math.max(1, Number(sp.page || 1) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const auth = await getApiUser(new Request("http://localhost/ideas", { headers: await headers() }));
  const favoriteSlugs = auth ? (await getProfileFavorites(auth.userId)).idea.map((item) => item.id) : [];

  const [ideas, total] = await Promise.all([
    listIdeas({ search: q || undefined, limit: PAGE_SIZE, offset, favoriteSlugs }).catch(() => []),
    countIdeas({ search: q || undefined }).catch(() => 0),
  ]);

  return (
    <main className="bg-[color:var(--background)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 sm:pt-8">
        <div className="mb-8">
          <h1 className={pageTitleClass}>Ideas</h1>
          <p className={`${pageDescClass} max-w-2xl text-[15px] leading-6`}>
            Search and browse curated startup and product ideas — discover, save, and build.
          </p>
        </div>

        <FavoritesProvider itemType="idea" initial={{ userId: auth?.userId ?? null, slugs: favoriteSlugs }}>
          <IdeasHubBrowser
            initialIdeas={ideas}
            initialTotal={total}
            initialPage={page}
            initialQuery={q}
            initialUserId={auth?.userId ?? null}
          />
        </FavoritesProvider>
      </div>
    </main>
  );
}
