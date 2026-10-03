import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getProfileById, updateProfile } from "@/lib/db/profile";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const profile = await getProfileById(user.id);
  return NextResponse.json({
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    role: profile?.role ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await updateProfile(user.id, {
    full_name: typeof body.full_name === "string" || body.full_name === null ? (body.full_name as string | null) : undefined,
    avatar_url:
      typeof body.avatar_url === "string" || body.avatar_url === null
        ? (body.avatar_url as string | null)
        : undefined,
  });

  const profile = await getProfileById(user.id);
  return NextResponse.json({
    full_name: profile?.full_name ?? null,
    avatar_url: profile?.avatar_url ?? null,
    role: profile?.role ?? null,
  });
}
