import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CaptchaError, consumeCaptcha, issueCaptcha, requireCaptchaOrigin } from "./captcha-server";

const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie, Origin" };
export function captchaFailure(error: unknown) {
  const status = error instanceof CaptchaError ? error.status : 503;
  return NextResponse.json({ error: error instanceof CaptchaError ? error.message : "Security verification is unavailable. Please try again later." },
    { status, headers: { ...headers, ...(status === 429 ? { "Retry-After": "60" } : {}) } });
}
export async function captchaChallengeGET(request: Request) {
  try { return NextResponse.json(await issueCaptcha(request), { headers }); }
  catch (error) { return captchaFailure(error); }
}

/** TODO(auth): migrate to Turnstile with Supabase enforcement to cover direct Supabase calls. */
export async function captchaEmailPOST(request: Request) {
  try {
    requireCaptchaOrigin(request);
    if (Number(request.headers.get("content-length") || 0) > 24000) throw new CaptchaError("Invalid request.", 413);
    let body: { action?: unknown; email?: unknown; password?: unknown; name?: unknown; redirectTo?: unknown; altcha?: unknown };
    try { body = await request.json(); } catch { throw new CaptchaError("Invalid request."); }
    if (!body || typeof body !== "object") throw new CaptchaError("Invalid request.");
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email || email.length > 254 || !["login", "register", "forgot-password", "magic-link"].includes(String(body.action))) throw new CaptchaError("Invalid request.");
    const password = typeof body.password === "string" ? body.password : "";
    if (["login", "register"].includes(String(body.action)) && (!password || password.length > 1024)) throw new CaptchaError("Email and password are required.");
    const callback = new URL("/auth/callback", request.url);
    callback.searchParams.set("next", body.action === "forgot-password" ? "/reset-password" : "/dashboard");
    if (body.redirectTo !== undefined) {
      if (typeof body.redirectTo !== "string" || body.redirectTo.length > 2048) throw new CaptchaError("Invalid redirect.");
      let provided: URL;
      try { provided = new URL(body.redirectTo); } catch { throw new CaptchaError("Invalid redirect."); }
      if (provided.origin !== callback.origin || provided.pathname !== callback.pathname || provided.username || provided.password || provided.hash) throw new CaptchaError("Invalid redirect.");
      const next = provided.searchParams.get("next");
      if (next && (!next.startsWith("/") || next.startsWith("//") || next.includes("\\") || /[\u0000-\u0020\u007f]/.test(next) || new URL(next, callback.origin).origin !== callback.origin)) throw new CaptchaError("Invalid redirect.");
      callback.search = provided.search;
    }
    await consumeCaptcha(request, body.altcha);
    const supabase = await createClient();
    let result;
    if (body.action === "login") result = await supabase.auth.signInWithPassword({ email, password });
    else if (body.action === "register") result = await supabase.auth.signUp({ email, password, options: {
      emailRedirectTo: callback.toString(), data: { full_name: typeof body.name === "string" ? body.name.trim().slice(0, 100) : "" },
    } });
    else if (body.action === "forgot-password") result = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback.toString() });
    else result = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callback.toString() } });
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400, headers });
    return NextResponse.json({ data: result.data ?? { user: null, session: null } }, { headers });
  } catch (error) { return captchaFailure(error); }
}
