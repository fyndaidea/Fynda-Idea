import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import {
  addFeedbackVote,
  getFeedbackPostById,
  removeFeedbackVote,
} from "@/lib/db/feedback-db";

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
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const postId = (id ?? "").trim();
    if (!isUuid(postId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const exists = await getFeedbackPostById(postId);
    if (!exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await addFeedbackVote(postId, auth.userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Feedback vote POST error:", e);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const postId = (id ?? "").trim();
    if (!isUuid(postId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await removeFeedbackVote(postId, auth.userId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Feedback vote DELETE error:", e);
    return NextResponse.json({ error: "Failed to unvote" }, { status: 500 });
  }
}
