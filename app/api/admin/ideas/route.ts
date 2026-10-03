import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { adminWriteErrorResponse } from "@/lib/admin/api-write-error";
import { createIdea, listIdeas } from "@/lib/db/ideas-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  try {
    const ideas = await listIdeas({ includeDrafts: true, limit: 500 });
    return NextResponse.json({ ideas });
  } catch (e) {
    console.error("[admin/ideas GET]", e);
    return NextResponse.json({ error: "Failed to load ideas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    const row = await createIdea({
      title,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      summary: typeof body.summary === "string" ? body.summary : "",
      body: typeof body.body === "string" ? body.body : "",
      status: body.status === "published" ? "published" : "draft",
      featured: Boolean(body.featured),
      score: typeof body.score === "number" ? body.score : 50,
      category_ids: Array.isArray(body.category_ids) ? body.category_ids.map(String) : [],
      tags: Array.isArray(body.tags) ? body.tags.map(String) : [],
      highlights: Array.isArray(body.highlights) ? body.highlights.map(String) : [],
      author_name: typeof body.author_name === "string" ? body.author_name : null,
    });
    return NextResponse.json({ idea: row }, { status: 201 });
  } catch (e) {
    return adminWriteErrorResponse(e, "Failed to create");
  }
}
