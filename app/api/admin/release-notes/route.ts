import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { createReleaseNote, listReleaseNotes } from "@/lib/db/feedback-db";

export const dynamic = "force-dynamic";

function clampInt(v: string | null, def: number, min: number, max: number): number {
  if (!v) return def;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const limit = clampInt(url.searchParams.get("limit"), 100, 1, 500);
    const offset = clampInt(url.searchParams.get("offset"), 0, 0, 50_000);

    const notes = await listReleaseNotes({ publishedOnly: false, limit, offset });
    return NextResponse.json({ notes });
  } catch (e) {
    console.error("Admin release notes GET error:", e);
    return NextResponse.json({ error: "Failed to load release notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const bodyMd = typeof body?.body_md === "string" ? body.body_md.trim() : "";

    if (!title || title.length > 140) {
      return NextResponse.json({ error: "title is required (max 140 chars)" }, { status: 400 });
    }
    if (!bodyMd || bodyMd.length > 200_000) {
      return NextResponse.json({ error: "body_md is required (max 200k chars)" }, { status: 400 });
    }

    const row = await createReleaseNote({ title, body_md: bodyMd });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("Admin release notes POST error:", e);
    return NextResponse.json({ error: "Failed to create release note" }, { status: 500 });
  }
}
