import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { deleteRoadmapItem, updateRoadmapItem } from "@/lib/db/feedback-db";

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
    const itemId = (id ?? "").trim();
    if (!isUuid(itemId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const patch: {
      title?: string;
      description?: string | null;
      status?: string;
      target_date?: Date | null;
      sort_order?: number;
    } = {};

    if ("title" in body && typeof body.title === "string") {
      const t = body.title.trim();
      if (t) patch.title = t.slice(0, 140);
    }
    if ("description" in body) {
      if (body.description === null) patch.description = null;
      else if (typeof body.description === "string") {
        const d = body.description.trim();
        patch.description = d ? d.slice(0, 10_000) : null;
      }
    }
    if ("status" in body && typeof body.status === "string") {
      const s = body.status.trim();
      if (s) patch.status = s.slice(0, 40);
    }
    if ("sort_order" in body) {
      const so =
        typeof body.sort_order === "number"
          ? body.sort_order
          : typeof body.sort_order === "string"
            ? parseInt(body.sort_order, 10)
            : 0;
      if (Number.isFinite(so)) {
        patch.sort_order = Math.max(-10_000, Math.min(10_000, Math.trunc(so)));
      }
    }
    if ("target_date" in body) {
      if (body.target_date === null) patch.target_date = null;
      else if (typeof body.target_date === "string") {
        const td = body.target_date.trim();
        patch.target_date = td ? new Date(`${td}T00:00:00.000Z`) : null;
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const row = await updateRoadmapItem(itemId, patch);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin roadmap PATCH error:", e);
    return NextResponse.json({ error: "Failed to update roadmap item" }, { status: 500 });
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
    const itemId = (id ?? "").trim();
    if (!isUuid(itemId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const res = await deleteRoadmapItem(itemId);
    if ((res?.numDeletedRows ?? BigInt(0)) === BigInt(0)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Admin roadmap DELETE error:", e);
    return NextResponse.json({ error: "Failed to delete roadmap item" }, { status: 500 });
  }
}
