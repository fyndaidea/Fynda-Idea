import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { getFeedbackVoteStats, listFeedbackPosts } from "@/lib/db/feedback-db";

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
    const status = url.searchParams.get("status")?.trim() || "";
    const limit = clampInt(url.searchParams.get("limit"), 200, 1, 500);

    const posts = await listFeedbackPosts({
      status: status || undefined,
      limit,
    });
    const ids = posts.map((p) => String(p.id));
    const { countByPostId } = await getFeedbackVoteStats(ids);

    return NextResponse.json({
      posts: posts.map((p) => ({
        ...p,
        voteCount: countByPostId.get(String(p.id)) ?? 0,
      })),
    });
  } catch (e) {
    console.error("Admin feedback GET error:", e);
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}
