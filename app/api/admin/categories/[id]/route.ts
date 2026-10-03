import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { adminWriteErrorResponse } from "@/lib/admin/api-write-error";
import { deleteCategory, updateCategory } from "@/lib/db/categories-db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const row = await updateCategory(id, {
      name: typeof body.name === "string" ? body.name : undefined,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: typeof body.description === "string" ? body.description : undefined,
      sort_order: typeof body.sort_order === "number" ? body.sort_order : undefined,
      published: typeof body.published === "boolean" ? body.published : undefined,
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ category: row });
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
  await deleteCategory(id);
  return NextResponse.json({ ok: true });
}
