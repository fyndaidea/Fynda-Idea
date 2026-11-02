import { IdeasHubBrowser } from "@/components/directory/IdeasHubBrowser";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";
import { getApiUser } from "@/lib/auth/get-api-user";
import { listCategories } from "@/lib/db/categories-db";
import { getProfileById } from "@/lib/db/profile";
import { ideasDirectory } from "@/lib/ideas/directory";
import { parseDirectoryOptions } from "@/lib/ideas/directory-options";
import { pageDescClass, pageTitleClass } from "@/lib/ui-classes";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Ideas",
  description: "Browse curated startup and product ideas on Fynda Idea.",
};

export default async function IdeasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams(Object.entries(sp).flatMap(([key, value]) => typeof value === "string" ? [[key, value]] : []));
  const options = parseDirectoryOptions(params);
  const auth = await getApiUser(new Request("http://localhost/ideas", { headers: await headers() }));
  const profile = auth ? await getProfileById(auth.userId) : null;
  const canEdit = profile?.role === "admin";
  const [result, categories] = await Promise.all([
    ideasDirectory(options, auth?.userId).catch(() => ({ ideas: [], total: 0, page: 1, favorites: [], stages: undefined, stageError: undefined, error: "Could not load ideas. Please try again." })),
    canEdit ? listCategories({ includeUnpublished: true }) : Promise.resolve([]),
  ]);
  const error = "error" in result ? result.error : undefined;

  return (
    <main className="bg-[color:var(--background)]">
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-12 pt-6 sm:pt-8">
        <div className="mb-8">
          <h1 className={pageTitleClass}>Ideas</h1>
          <p className={`${pageDescClass} max-w-2xl text-[15px] leading-6`}>
            Search and browse curated startup and product ideas — discover, save, and build.
          </p>
        </div>

        <FavoritesProvider itemType="idea" initial={{ userId: auth?.userId ?? null, slugs: result.favorites }}>
          <IdeasHubBrowser
            initialIdeas={result.ideas}
            initialTotal={result.total}
            initialPage={result.page}
            initialQuery={options.q}
            initialUserId={auth?.userId ?? null}
            initialStages={result.stages}
            initialError={error}
            canEdit={canEdit}
            categories={categories.map((category) => ({ id: String(category.id), name: category.name }))}
          />
        </FavoritesProvider>
      </div>
    </main>
  );
}
