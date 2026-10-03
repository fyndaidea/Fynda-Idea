import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { setReleaseNotePublished } from "@/lib/db/feedback-db";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

export async function POST(
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

    const body = (await request.json().catch(() => ({}))) as { publish?: unknown };
    const publish = body?.publish !== false;

    const row = await setReleaseNotePublished(noteId, publish);
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, published: publish });
  } catch (e) {
    console.error("Admin release notes publish POST error:", e);
    return NextResponse.json({ error: "Failed to update publish state" }, { status: 500 });
  }
}
