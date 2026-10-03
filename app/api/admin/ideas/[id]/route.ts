import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { adminWriteErrorResponse } from "@/lib/admin/api-write-error";
import { deleteIdea, getIdeaById, updateIdea } from "@/lib/db/ideas-db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const { id } = await params;
  const idea = await getIdeaById(id);
  if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ idea });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const row = await updateIdea(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      summary: typeof body.summary === "string" ? body.summary : undefined,
      body: typeof body.body === "string" ? body.body : undefined,
      status: body.status === "published" || body.status === "draft" ? body.status : undefined,
      featured: typeof body.featured === "boolean" ? body.featured : undefined,
      score: typeof body.score === "number" ? body.score : undefined,
      category_ids: Array.isArray(body.category_ids) ? body.category_ids.map(String) : undefined,
      tags: Array.isArray(body.tags) ? body.tags.map(String) : undefined,
      highlights: Array.isArray(body.highlights) ? body.highlights.map(String) : undefined,
      author_name:
        typeof body.author_name === "string" || body.author_name === null
          ? (body.author_name as string | null)
          : undefined,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ idea: row });
  } catch (e) {
    return adminWriteErrorResponse(e, "Failed to update");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const { id } = await params;
  await deleteIdea(id);
  return NextResponse.json({ ok: true });
}
