import { NextResponse } from "next/server";
import { listCollectionSummaries } from "@/lib/db/collections-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const collections = await listCollectionSummaries();
    return NextResponse.json({ collections });
  } catch (e) {
    console.error("[api/collections]", e);
    return NextResponse.json({ error: "Failed to load collections" }, { status: 500 });
  }
}
