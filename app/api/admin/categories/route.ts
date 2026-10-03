import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { adminWriteErrorResponse } from "@/lib/admin/api-write-error";
import { createCategory, listCategories } from "@/lib/db/categories-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const categories = await listCategories({ includeUnpublished: true });
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
    const row = await createCategory({
      name,
      slug: typeof body.slug === "string" ? body.slug : undefined,
      description: typeof body.description === "string" ? body.description : "",
      sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
      published: body.published !== false,
    });
    return NextResponse.json({ category: row }, { status: 201 });
  } catch (e) {
    return adminWriteErrorResponse(e, "Failed");
  }
}
