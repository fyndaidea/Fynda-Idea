import { NextRequest, NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth/get-api-user";
import {
  createFeedbackPost,
  getFeedbackVoteStats,
  listFeedbackPosts,
} from "@/lib/db/feedback-db";

export const dynamic = "force-dynamic";

function clampInt(v: string | null, def: number, min: number, max: number): number {
  if (!v) return def;
  const n = parseInt(v, 10);
  if (!Number.isFinite(n)) return def;
  return Math.max(min, Math.min(max, n));
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getApiUser(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status")?.trim() || "";
    const q = url.searchParams.get("q")?.trim() || "";
    const limit = clampInt(url.searchParams.get("limit"), 50, 1, 100);
    const offset = clampInt(url.searchParams.get("offset"), 0, 0, 10_000);

    const posts = await listFeedbackPosts({
      status: status || undefined,
      q: q || undefined,
      limit,
      offset,
    });

    const ids = posts.map((p) => String(p.id));
    const { countByPostId, votedByMe } = await getFeedbackVoteStats(ids, auth?.userId);

    return NextResponse.json({
      posts: posts.map((p) => ({
        ...p,
        voteCount: countByPostId.get(String(p.id)) ?? 0,
        votedByMe: votedByMe.has(String(p.id)),
      })),
    });
  } catch (e) {
    console.error("Feedback GET error:", e);
    return NextResponse.json({ error: "Failed to fetch feedback" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getApiUser(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    const category = typeof body?.category === "string" ? body.category.trim() : "";

    if (!title || title.length > 140) {
      return NextResponse.json({ error: "title is required (max 140 chars)" }, { status: 400 });
    }
    if (description.length > 10_000) {
      return NextResponse.json({ error: "description is too long" }, { status: 400 });
    }
    if (category.length > 60) {
      return NextResponse.json({ error: "category is too long" }, { status: 400 });
    }

    const row = await createFeedbackPost({
      user_id: auth.userId,
      title,
      description: description || null,
      category: category || null,
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error("Feedback POST error:", e);
    return NextResponse.json({ error: "Failed to create feedback" }, { status: 500 });
  }
}
