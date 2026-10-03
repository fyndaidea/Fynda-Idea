import { NextResponse } from "next/server";
import { upsertProfileFromUser } from "@/lib/auth/sync-profile";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await upsertProfileFromUser(user);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/auth/sync-profile]", e);
    return NextResponse.json({ error: "Profile sync failed" }, { status: 500 });
  }
}
