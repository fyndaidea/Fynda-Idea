import { NextResponse } from "next/server";
import { normalizeWaitlistEmail } from "./waitlist-email";

type WaitlistDependencies = {
  getAccountEmail: () => Promise<string | null | undefined>;
  /** Rate limit for guest signups; resolves false when the caller should back off. */
  allowGuest: (request: Request) => Promise<boolean>;
  joinWaitlist: (email: string) => Promise<unknown>;
};

const JOINED = "You’re on the waitlist. We’ll email you when we launch.";

/** Signed-in visitors always join with their verified account email; guests type one in. */
export function createWaitlistHandler({ getAccountEmail, allowGuest, joinWaitlist }: WaitlistDependencies) {
  return async function POST(request: Request) {
    const headers = { "Cache-Control": "private, no-store" };
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
    }
    try {
      let email = normalizeWaitlistEmail(await getAccountEmail());
      if (!email) {
        if (!origin) return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers });
        const body = await readBody(request);
        // Bots fill the hidden field; pretend it worked so they don't adapt.
        if (body.website) return NextResponse.json({ ok: true, message: JOINED }, { headers });
        email = normalizeWaitlistEmail(body.email);
        if (!email) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400, headers });
        if (!(await allowGuest(request))) {
          return NextResponse.json({ error: "Too many signups. Please wait a minute and try again." },
            { status: 429, headers: { ...headers, "Retry-After": "60" } });
        }
      }
      await joinWaitlist(email);
      return NextResponse.json({ ok: true, message: JOINED }, { headers });
    } catch (error) {
      console.error("[waitlist] Signup failed", error instanceof Error ? error.name : "Unknown error");
      return NextResponse.json({ error: "Could not join the waitlist. Please try again later." }, { status: 503, headers });
    }
  };
}

async function readBody(request: Request): Promise<{ email?: unknown; website?: unknown }> {
  if (Number(request.headers.get("content-length") || 0) > 2048) return {};
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch {
    return {};
  }
}
