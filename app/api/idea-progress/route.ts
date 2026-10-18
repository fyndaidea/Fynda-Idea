import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiUser } from "@/lib/auth/get-api-user";
import { getIdeaById } from "@/lib/db/ideas-db";
import { listIdeaProgress, saveIdeaProgress } from "@/lib/db/idea-progress-db";
import { isIdeaProgressStatus } from "@/lib/ideas/progress";

export const dynamic = "force-dynamic";
const idSchema = z.string().uuid();
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie, Authorization" };

export async function GET(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const ideaId = request.nextUrl.searchParams.get("ideaId") ?? undefined;
  if (ideaId && !idSchema.safeParse(ideaId).success) return NextResponse.json({ error: "Invalid idea" }, { status: 400, headers });
  try {
    return NextResponse.json({ userId: auth.userId, progress: await listIdeaProgress(auth.userId, ideaId) }, { headers });
  } catch (error) {
    console.error("[idea-progress GET]", error);
    return NextResponse.json({ error: "Could not load your idea statuses" }, { status: 500, headers });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getApiUser(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const body = await request.json().catch(() => null);
  if (body?.expectedUserId !== undefined && body.expectedUserId !== auth.userId) {
    return NextResponse.json({ error: "Your account changed. Reload before updating this status." }, { status: 409, headers });
  }
  if (!body || !idSchema.safeParse(body.ideaId).success || (body.status !== null && !isIdeaProgressStatus(body.status))) {
    return NextResponse.json({ error: "Valid idea and status required" }, { status: 400, headers });
  }
  try {
    const idea = await getIdeaById(body.ideaId);
    if (!idea || idea.status !== "published") return NextResponse.json({ error: "Idea not found" }, { status: 404, headers });
    await saveIdeaProgress(auth.userId, idea.id, body.status);
    return NextResponse.json({ status: body.status }, { headers });
  } catch (error) {
    console.error("[idea-progress PATCH]", error);
    return NextResponse.json({ error: "Could not save your idea status" }, { status: 500, headers });
  }
}
