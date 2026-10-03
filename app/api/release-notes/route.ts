import { NextRequest, NextResponse } from "next/server";
import { listReleaseNotes } from "@/lib/db/feedback-db";

export const dynamic = "force-dynamic";

function clampInt(v: string | null, def: number, min: number, max: number): number {
  if (!v) return def;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = clampInt(url.searchParams.get("limit"), 20, 1, 100);
    const notes = await listReleaseNotes({ publishedOnly: true, limit });
    return NextResponse.json({ notes });
  } catch (e) {
    console.error("Release notes GET error:", e);
    return NextResponse.json({ error: "Failed to fetch release notes" }, { status: 500 });
  }
}
