import { NextResponse } from "next/server";
import { listCategorySummaries } from "@/lib/db/categories-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await listCategorySummaries();
    return NextResponse.json({ categories });
  } catch (e) {
    console.error("[api/categories]", e);
    return NextResponse.json({ error: "Failed to load categories" }, { status: 500 });
  }
}
