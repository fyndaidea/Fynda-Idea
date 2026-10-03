import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase/auth-client";

/**
 * POST /api/auth/refresh
 * Exchange refresh_token for a new access_token and refresh_token.
 * Body: { "refresh_token": string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const refreshToken = typeof body.refresh_token === "string" ? body.refresh_token.trim() : "";

    if (!refreshToken) {
      return NextResponse.json({ error: "refresh_token is required" }, { status: 400 });
    }

    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    const session = data.session;
    if (!session) {
      return NextResponse.json({ error: "No session returned" }, { status: 401 });
    }

    return NextResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in ?? 3600,
      token_type: "bearer",
    });
  } catch (e) {
    console.error("[api/auth/refresh]", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

