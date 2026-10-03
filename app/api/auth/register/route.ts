import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthClient } from "@/lib/supabase/auth-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "email and password are required" }, { status: 400 });
    }

    const supabase = getSupabaseAuthClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message || "Registration failed" }, { status: 400 });
    }

    const session = data.session;
    if (session) {
      return NextResponse.json({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in ?? 3600,
        token_type: "bearer",
        message: "Registered successfully.",
      });
    }

    return NextResponse.json({
      message: "Registration successful. Check your email to confirm your account.",
    });
  } catch (e) {
    console.error("[api/auth/register]", e);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
