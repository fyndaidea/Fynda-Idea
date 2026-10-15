import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { normalizeWaitlistEmail } from "../lib/access/waitlist-email";
import { createWaitlistHandler } from "../lib/access/waitlist-signup";
import { getCookingHtml } from "../lib/access/admin-only";

const site = "https://fynda.test";
const allow = async () => true;
const guestPost = (body: object, headers: Record<string, string> = {}) =>
  new Request(`${site}/api/waitlist`, { method: "POST", headers: { origin: site, "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

test("waitlist normalizes emails and rejects malformed values", () => {
  assert.equal(normalizeWaitlistEmail(" Person@Example.com "), "person@example.com");
  for (const value of [null, {}, 42, "", "a b@example.com", "person@", "a".repeat(255) + "@example.com"]) assert.equal(normalizeWaitlistEmail(value), null);
});
test("launch screen asks guests for an email and signed-in visitors for one click", () => {
  const guest = getCookingHtml();
  const signedIn = getCookingHtml(true);
  assert.match(guest, /href="\/login"/);
  assert.match(guest, /href="\/register"/);
  assert.match(guest, /<input id="waitlist-email" name="email" type="email"[^>]*required/);
  assert.match(guest, /<label class="sr-only" for="waitlist-email">/);
  assert.match(guest, /<input class="hp" name="website" tabindex="-1"/);
  assert.doesNotMatch(guest, /id="launch-signout"/);
  assert.match(signedIn, /id="launch-signout"[^>]*>Sign out/);
  assert.doesNotMatch(signedIn, /href="\/(?:login|register)"/);
  assert.doesNotMatch(signedIn, /<input/);
  for (const html of [guest, signedIn]) assert.match(html, />Join waitlist<\/button>/);
});
test("signed-in visitors join with their verified account email, ignoring a supplied address", async () => {
  const emails: string[] = [];
  const post = createWaitlistHandler({ getAccountEmail: async () => " Account@Example.com ", allowGuest: async () => assert.fail("Accounts are not rate limited"), joinWaitlist: async email => { emails.push(email); } });
  const response = await post(guestPost({ email: "spoof@example.com" }));
  assert.equal(response.status, 200);
  assert.deepEqual(emails, ["account@example.com"]);
  assert.match(response.headers.get("Cache-Control")!, /no-store/);
});
test("guests join with the email they type", async () => {
  const emails: string[] = [];
  const post = createWaitlistHandler({ getAccountEmail: async () => null, allowGuest: allow, joinWaitlist: async email => { emails.push(email); } });
  const response = await post(guestPost({ email: " Guest@Example.com " }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
  assert.deepEqual(emails, ["guest@example.com"]);
});
test("guests need a valid email", async () => {
  const post = createWaitlistHandler({ getAccountEmail: async () => null, allowGuest: allow, joinWaitlist: async () => assert.fail("Must not write") });
  for (const body of [{}, { email: "nope" }, { email: 42 }]) assert.equal((await post(guestPost(body))).status, 400);
  const malformed = new Request(`${site}/api/waitlist`, { method: "POST", headers: { origin: site }, body: "{" });
  assert.equal((await post(malformed)).status, 400);
});
test("guest signups are rate limited", async () => {
  const post = createWaitlistHandler({ getAccountEmail: async () => null, allowGuest: async () => false, joinWaitlist: async () => assert.fail("Must not write") });
  const response = await post(guestPost({ email: "guest@example.com" }));
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "60");
});
test("the honeypot looks successful but stores nothing", async () => {
  const post = createWaitlistHandler({ getAccountEmail: async () => null, allowGuest: async () => assert.fail("Must not count"), joinWaitlist: async () => assert.fail("Must not write") });
  const response = await post(guestPost({ email: "bot@example.com", website: "https://spam.test" }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});
test("guest requests without an Origin header are rejected", async () => {
  const post = createWaitlistHandler({ getAccountEmail: async () => null, allowGuest: allow, joinWaitlist: async () => assert.fail("Must not write") });
  const response = await post(new Request(`${site}/api/waitlist`, { method: "POST", body: JSON.stringify({ email: "guest@example.com" }) }));
  assert.equal(response.status, 403);
});
test("cross-origin requests are rejected before accessing the account", async () => {
  const post = createWaitlistHandler({ getAccountEmail: async () => assert.fail("Must not authenticate"), allowGuest: allow, joinWaitlist: async () => assert.fail("Must not write") });
  const response = await post(guestPost({ email: "guest@example.com" }, { origin: "https://other.test" }));
  assert.equal(response.status, 403);
});
test("a failed write never reports a joined account", async () => {
  const post = createWaitlistHandler({ getAccountEmail: async () => "account@example.com", allowGuest: allow, joinWaitlist: async () => { throw new Error("Unavailable"); } });
  const response = await post(new Request(`${site}/api/waitlist`, { method: "POST" }));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).ok, undefined);
});

function browser(signedIn: boolean, response: { status: number; ok: boolean; json: () => Promise<object> }, typed = "") {
  const events: Record<string, () => Promise<void>> = {};
  const button = { disabled: false, textContent: "Join waitlist" };
  const input = { value: typed, disabled: false, focused: false, focus() { this.focused = true; } };
  const trap = { value: "" };
  const status = { textContent: "", dataset: { error: "false" } };
  const signout = { disabled: false, textContent: "Sign out", addEventListener: (_: string, callback: () => Promise<void>) => { events.signout = callback; } };
  const fields: Record<string, object | null> = { "button[type=submit]": button, "input[name=email]": signedIn ? null : input, "input[name=website]": signedIn ? null : trap };
  const form = { dataset: { signedIn: String(signedIn) }, querySelector: (selector: string) => fields[selector] ?? null, addEventListener: (_: string, callback: () => Promise<void>) => { events.submit = callback; } };
  const calls: { url: string; options: { body?: string } }[] = [];
  const navigations: string[] = [];
  runInNewContext(readFileSync("public/launch-waitlist.js", "utf8"), {
    document: { getElementById: (id: string) => ({ "waitlist-form": form, "waitlist-status": status, "launch-signout": signout })[id as "waitlist-form"] },
    window: { location: { assign: (url: string) => navigations.push(url), replace: (url: string) => navigations.push(url), reload: () => navigations.push("reload") } },
    fetch: async (url: string, options: object) => { calls.push({ url, options }); return response; },
  });
  return { submit: () => (events.submit as unknown as (event: object) => Promise<void>)({ preventDefault() {} }), signout: events.signout, calls, navigations, button, input, status };
}
const success = { status: 200, ok: true, json: async () => ({ ok: true }) };
test("guests submit the email they typed, without visiting login", async () => {
  const ui = browser(false, success, " guest@example.com ");
  await ui.submit();
  assert.equal(ui.calls[0].url, "/api/waitlist");
  assert.deepEqual(JSON.parse(ui.calls[0].options.body!), { email: "guest@example.com", website: "" });
  assert.deepEqual(ui.navigations, []);
  assert.equal(ui.button.textContent, "Joined");
  assert.equal(ui.input.disabled, true);
});
test("guests are asked for an email before anything is sent", async () => {
  const ui = browser(false, success);
  await ui.submit();
  assert.equal(ui.calls.length, 0);
  assert.equal(ui.status.dataset.error, "true");
  assert.equal(ui.input.focused, true);
});
test("a rejected guest email can be corrected and resubmitted", async () => {
  const ui = browser(false, { status: 400, ok: false, json: async () => ({ error: "Enter a valid email address." }) }, "x@y");
  await ui.submit();
  assert.equal(ui.status.textContent, "Enter a valid email address.");
  assert.equal(ui.button.disabled, false);
  assert.equal(ui.input.disabled, false);
});
test("signed-in join needs no form fields and prevents repeat submissions", async () => {
  const ui = browser(true, success);
  await ui.submit();
  assert.equal(ui.calls[0].url, "/api/waitlist");
  assert.equal("body" in ui.calls[0].options, false);
  assert.equal(ui.button.textContent, "Joined");
  assert.equal(ui.button.disabled, true);
});
test("an expired session reloads to show the email form", async () => {
  const ui = browser(true, { status: 400, ok: false, json: async () => ({}) });
  await ui.submit();
  assert.deepEqual(ui.navigations, ["reload"]);
});
test("Sign out uses the existing auth endpoint and reloads the launch page", async () => {
  const ui = browser(true, success);
  await ui.signout();
  assert.equal(ui.calls[0].url, "/api/auth/signout");
  assert.deepEqual(ui.navigations, ["/"]);
});
