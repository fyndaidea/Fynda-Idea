import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { deleteReleaseNote, updateReleaseNote } from "@/lib/db/feedback-db";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const noteId = (id ?? "").trim();
    if (!isUuid(noteId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const patch: { title?: string; body_md?: string; published_at?: Date | null } = {};

    if ("title" in body && typeof body.title === "string") {
      const t = body.title.trim();
      if (t) patch.title = t.slice(0, 140);
    }
    if ("body_md" in body && typeof body.body_md === "string") {
      const md = body.body_md.trim();
      if (md) patch.body_md = md.slice(0, 200_000);
    }
    if ("published_at" in body) {
      if (body.published_at === null) patch.published_at = null;
      else if (typeof body.published_at === "string") {
        const v = body.published_at.trim();
        patch.published_at = v ? new Date(v) : null;
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const row = await updateReleaseNote(noteId, patch);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin release notes PATCH error:", e);
    return NextResponse.json({ error: "Failed to update release note" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const noteId = (id ?? "").trim();
    if (!isUuid(noteId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const res = await deleteReleaseNote(noteId);
    if ((res?.numDeletedRows ?? BigInt(0)) === BigInt(0)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin release notes DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete release note" }, { status: 500 });
  }
}
