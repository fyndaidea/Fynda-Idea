import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase/auth-client";

/**
 * POST /api/auth/token
 * Exchange email + password for access_token and refresh_token (OAuth2-style token endpoint).
 * Body: { "email": string, "password": string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message || "Invalid credentials" }, { status: 401 });
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
    console.error("[api/auth/token]", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

