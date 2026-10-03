import { NextRequest, NextResponse } from "next/server";
import { listRoadmapItems } from "@/lib/db/feedback-db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim() || "";
    const items = await listRoadmapItems({ status: status || undefined });
    return NextResponse.json({ items });
  } catch (e) {
    console.error("Roadmap GET error:", e);
    return NextResponse.json({ error: "Failed to fetch roadmap" }, { status: 500 });
  }
}
