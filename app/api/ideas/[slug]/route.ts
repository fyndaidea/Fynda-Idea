import { NextResponse } from "next/server";
import { getIdeaBySlug } from "@/lib/db/ideas-db";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const idea = await getIdeaBySlug(slug);
    if (!idea) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ idea });
  } catch (e) {
    console.error("[api/ideas/slug]", e);
    return NextResponse.json({ error: "Failed to load idea" }, { status: 500 });
  }
}
