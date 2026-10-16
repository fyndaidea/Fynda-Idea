import { NextRequest, NextResponse } from "next/server";
import { listIdeas, countIdeas } from "@/lib/db/ideas-db";
import { getApiUser } from "@/lib/auth/get-api-user";
import { getProfileFavorites } from "@/lib/favorites/store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q")?.trim() || "";
    const pageSizeParam = Number(request.nextUrl.searchParams.get("pageSize") || 0);
    const limitParam = Number(request.nextUrl.searchParams.get("limit") || 0);
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") || 1) || 1);
    const pageSize = Math.min(
      100,
      Math.max(1, pageSizeParam || limitParam || 50)
    );
    const offset = (page - 1) * pageSize;
    const featuredOnly = request.nextUrl.searchParams.get("featured") === "1";
    const auth = request.nextUrl.searchParams.get("favoritesFirst") === "1"
      ? await getApiUser(request)
      : null;
    const favoriteSlugs = auth ? (await getProfileFavorites(auth.userId)).idea.map((item) => item.id) : [];
    const [ideas, total] = await Promise.all([
      listIdeas({ search: q || undefined, limit: pageSize, offset, featuredOnly, favoriteSlugs }),
      countIdeas({ search: q || undefined, featuredOnly }),
    ]);
    return NextResponse.json({ ideas, total, page, pageSize }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    console.error("[api/ideas]", e);
    return NextResponse.json({ error: "Failed to load ideas" }, { status: 500 });
  }
}
