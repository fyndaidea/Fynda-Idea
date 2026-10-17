import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { acknowledgeIdeaNotionSync } from "@/lib/db/ideas-db";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;
  try {
    const { revision } = await request.json();
    if (!Number.isSafeInteger(revision) || revision < 0) return NextResponse.json({ error: "Valid revision required" }, { status: 400 });
    const { id } = await params;
    const acknowledged = await acknowledgeIdeaNotionSync(id, revision);
    if (!acknowledged) return NextResponse.json({ error: "Idea changed or no longer exists. Fetch it again before syncing." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/ideas/notion-sync]", error);
    return NextResponse.json({ error: "Could not record Notion sync" }, { status: 500 });
  }
}
