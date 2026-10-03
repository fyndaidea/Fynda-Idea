import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { deleteIdeaSubmission, updateIdeaSubmissionStatus } from "@/lib/db/submissions-db";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const status = body.status;
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const row = await updateIdeaSubmissionStatus(id, status);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ submission: row });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const { id } = await params;
  await deleteIdeaSubmission(id);
  return NextResponse.json({ ok: true });
}
