import { LOGO_MARK_SVG } from "@/lib/brand/logo-mark";
import { PRODUCT_MARK_WORDMARK } from "@/lib/brand/product";

/** Public launch, account creation, and authenticated self-profile endpoints. */
export function isAdminGatePublicPath(path: string, method = "GET"): boolean {
  if (["/api/auth/signout", "/api/auth/sync-profile", "/api/waitlist"].includes(path)) return method === "POST";
  if (path === "/api/profile") return method === "GET";
  if (method !== "GET" && method !== "HEAD") return false;
  return path.startsWith("/_next/static/") || path === "/_next/webpack-hmr" || [
    "/login", "/register", "/admin/login", "/forgot-password", "/reset-password",
    "/auth/callback",
    "/launch-waitlist.js", "/favicon.ico", "/favicon-32.png", "/icon.svg", "/icon", "/apple-icon",
  ].includes(path);
}

export function isGateAdmin(role: string | null | undefined): boolean {
  return role === "admin";
}

export const ADMIN_GATE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  Vary: "Cookie, Authorization",
};

/** Independent of app data/providers so visitors can see the launch screen immediately. */
const JOIN_BUTTON = '<button type="submit">Join waitlist</button>';
/** Guests type an email; "website" is a honeypot that people never see. */
const GUEST_FIELDS = `<label class="sr-only" for="waitlist-email">Email address</label><div class="signup-row"><input id="waitlist-email" name="email" type="email" autocomplete="email" inputmode="email" maxlength="254" placeholder="you@example.com" required>${JOIN_BUTTON}</div><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">`;

export function getCookingHtml(signedIn = false): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fynda</title><meta name="robots" content="noindex,nofollow"><link rel="icon" href="/favicon.ico">
<style>
*{box-sizing:border-box}body{margin:0;background:#fafaf8;color:#242421;font-family:Arial,Helvetica,sans-serif;min-height:100svh;display:flex;flex-direction:column}header{padding:28px 36px} .brand{display:inline-flex;align-items:center;gap:10px;text-decoration:none}.brand svg{width:28px;height:28px;flex-shrink:0;border-radius:9px}.brand span{font-size:14px;font-weight:700;letter-spacing:-.35px}.account-links{display:flex;gap:20px;font-size:13px;align-items:center}header{display:flex;justify-content:space-between;align-items:center}main{flex:1;display:grid;place-items:center;padding:60px 24px;text-align:center}.content{max-width:680px}.eyebrow{color:#e14b36;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase}h1{font-size:clamp(42px,8vw,76px);line-height:1.04;letter-spacing:-3px;font-weight:600;margin:24px 0}p{font-size:17px;line-height:1.7;color:#72726b;margin:0 auto;max-width:410px}.dot{width:10px;height:10px;background:#e14b36;border-radius:50%;display:inline-block;margin-right:8px;box-shadow:0 0 0 5px #e14b3615}footer{padding:28px 36px;display:flex;justify-content:space-between;gap:20px;font-size:12px;color:#72726b}a{color:inherit;text-underline-offset:4px}a:hover{color:#e14b36}a:focus-visible{outline:2px solid #e14b36;outline-offset:5px}@media(max-width:480px){header,footer{padding:24px}h1{letter-spacing:-2px}}
form{max-width:430px;margin:32px auto 0;text-align:center}.sr-only,.hp{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}@media(max-width:480px){.signup-row{flex-direction:column}}label{display:block;font-size:13px;margin-bottom:8px}.signup-row{display:flex;gap:8px}input{min-width:0;flex:1;border:1px solid #d9d9d3;border-radius:8px;padding:14px;font:inherit;font-size:14px;background:white}button{border:0;border-radius:8px;padding:14px 18px;background:#ff3131;color:white;font-size:14px;font-weight:600;cursor:pointer}button:disabled{opacity:.6;cursor:wait}input:focus-visible,button:focus-visible{outline:2px solid #ff3131;outline-offset:3px}.account-links button{padding:0;border-radius:0;background:transparent;color:inherit;font:inherit;text-decoration:underline;text-underline-offset:4px}.account-links button:hover{color:#e14b36}.note{font-size:12px;margin:10px 0;color:#72726b}.status{font-size:13px;margin:12px 0;min-height:20px}.status[data-error=true]{color:#b42318}@media(max-width:480px){.signup-row{flex-direction:column}.account-links{gap:12px}}
</style><script>(function(){var h=location.hash;if(/(^|[#&])type=recovery(&|$)/.test(h)&&/access_token=/.test(h))location.replace("/reset-password"+h);})();</script><script src="/launch-waitlist.js" defer></script></head><body><header><a class="brand" href="/" aria-label="Fynda">${LOGO_MARK_SVG}<span>${PRODUCT_MARK_WORDMARK}</span></a><nav class="account-links" aria-label="Account">${signedIn ? '<button id="launch-signout" type="button">Sign out</button>' : '<a href="/login">Log in</a><a href="/register">Register</a>'}</nav></header>
<main><div class="content"><span class="eyebrow"><span class="dot" aria-hidden="true"></span>In the making</span><h1>Something is cooking.</h1><p>We’re getting things ready.<br>Join the waitlist and we’ll let you know when we launch.</p>
<form id="waitlist-form" action="/api/waitlist" method="post" data-signed-in="${signedIn}">${signedIn ? JOIN_BUTTON : GUEST_FIELDS}<p class="note">${signedIn ? "We’ll email the address on your account." : "No account needed. We’ll only email you about the launch."}</p><p id="waitlist-status" class="status" role="status" aria-live="polite"></p></form></div></main>
<footer><span>Fynda</span><span>Good things take a little time.</span></footer></body></html>`;
}

export const COOKING_HTML = getCookingHtml();
