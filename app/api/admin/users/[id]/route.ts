import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { updateProfileRole } from "@/lib/db/profile";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  if (body.role !== "user" && body.role !== "admin") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  await updateProfileRole(id, body.role);
  return NextResponse.json({ ok: true });
}
