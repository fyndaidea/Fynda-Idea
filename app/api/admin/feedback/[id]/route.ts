import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { deleteFeedbackPost, updateFeedbackPost } from "@/lib/db/feedback-db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const row = await updateFeedbackPost(id, {
    title: typeof body.title === "string" ? body.title : undefined,
    description:
      typeof body.description === "string" || body.description === null
        ? (body.description as string | null)
        : undefined,
    category:
      typeof body.category === "string" || body.category === null
        ? (body.category as string | null)
        : undefined,
    status: typeof body.status === "string" ? body.status : undefined,
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ post: row });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const { id } = await params;
  await deleteFeedbackPost(id);
  return NextResponse.json({ ok: true });
}
