import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { adminWriteErrorResponse } from "@/lib/admin/api-write-error";
import {
  deleteCollection,
  getCollectionById,
  listIdeaSlugsForCollection,
  updateCollection,
} from "@/lib/db/collections-db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const { id } = await params;
  const collection = await getCollectionById(id);
  if (!collection) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const idea_slugs = await listIdeaSlugsForCollection(id);
  return NextResponse.json({ collection, idea_slugs });
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
    const row = await updateCollection(id, {
      title: typeof body.title === "string" ? body.title : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      published: typeof body.published === "boolean" ? body.published : undefined,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : undefined,
      idea_slugs: Array.isArray(body.idea_slugs) ? body.idea_slugs.map(String) : undefined,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ collection: row });
  } catch (e) {
    return adminWriteErrorResponse(e, "Failed");
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const { id } = await params;
  await deleteCollection(id);
  return NextResponse.json({ ok: true });
}
