import { NextRequest, NextResponse } from "next/server";
import { listIdeas, countIdeas } from "@/lib/db/ideas-db";

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
    const [ideas, total] = await Promise.all([
      listIdeas({ search: q || undefined, limit: pageSize, offset, featuredOnly }),
      countIdeas({ search: q || undefined, featuredOnly }),
    ]);
    return NextResponse.json({ ideas, total, page, pageSize });
  } catch (e) {
    console.error("[api/ideas]", e);
    return NextResponse.json({ error: "Failed to load ideas" }, { status: 500 });
  }
}
