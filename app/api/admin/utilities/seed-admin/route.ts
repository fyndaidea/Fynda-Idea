import { NextRequest, NextResponse } from "next/server";
import { requireAdminApiResponse } from "@/lib/auth/require-admin-api";
import { getDb } from "@/lib/db";
import { seedAdminUser } from "@/lib/db/seed-admin-user";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const denied = await requireAdminApiResponse(request);
  if (denied) return denied;

  try {
    const body = (await request.json().catch(() => null)) as {
      email?: string;
      password?: string;
    } | null;
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const passwordRaw = body?.password;
    const password =
      passwordRaw != null && String(passwordRaw) !== "" ? String(passwordRaw) : undefined;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const lines = await seedAdminUser(getDb(), { email, password });
    return NextResponse.json({ ok: true, detail: lines.join("\n") });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Seed admin failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
