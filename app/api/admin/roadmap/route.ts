import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { createRoadmapItem, listRoadmapItems } from "@/lib/db/feedback-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  try {
    const items = await listRoadmapItems();
    return NextResponse.json({ items });
  } catch (e) {
    console.error("Admin roadmap GET error:", e);
    return NextResponse.json({ error: "Failed to load roadmap" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const status = typeof body?.status === "string" ? body.status.trim() : "planned";
    const targetDate = typeof body?.target_date === "string" ? body.target_date.trim() : "";
    const sortOrderRaw = body?.sort_order;
    const sortOrder =
      typeof sortOrderRaw === "number"
        ? sortOrderRaw
        : typeof sortOrderRaw === "string"
          ? parseInt(sortOrderRaw, 10)
          : 0;

    if (!title || title.length > 140) {
      return NextResponse.json({ error: "title is required (max 140 chars)" }, { status: 400 });
    }

    const row = await createRoadmapItem({
      title,
      description: description || null,
      status: status || "planned",
      target_date: targetDate ? new Date(`${targetDate}T00:00:00.000Z`) : null,
      sort_order: Math.max(-10_000, Math.min(10_000, Math.trunc(Number.isFinite(sortOrder) ? sortOrder : 0))),
    });

    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("Admin roadmap POST error:", e);
    return NextResponse.json({ error: "Failed to create roadmap item" }, { status: 500 });
  }
}
