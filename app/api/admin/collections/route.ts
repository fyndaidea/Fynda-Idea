import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { adminWriteErrorResponse } from "@/lib/admin/api-write-error";
import { createCollection, listCollections } from "@/lib/db/collections-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const collections = await listCollections({ includeUnpublished: true });
  return NextResponse.json({ collections });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
    const row = await createCollection({
      title,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: typeof body.description === "string" ? body.description : "",
      published: Boolean(body.published),
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      idea_slugs: Array.isArray(body.idea_slugs) ? body.idea_slugs.map(String) : [],
    });
    return NextResponse.json({ collection: row }, { status: 201 });
  } catch (e) {
    return adminWriteErrorResponse(e, "Failed");
  }
}
