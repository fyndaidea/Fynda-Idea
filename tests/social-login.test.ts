import assert from "node:assert/strict";
import test from "node:test";
import { canUseVerifiedAuthSession, isAdminLoginPath } from "../lib/auth/social-login-policy";

const user = { id: "verified-user", app_metadata: { provider: "google" } };
const oauth = { sub: user.id, amr: [{ method: "oauth" }] };

test("only an existing exact admin role can use social authentication", async () => {
  for (const role of [undefined, null, "user", "editor", "Admin", "superadmin"]) {
    assert.equal(await canUseVerifiedAuthSession(oauth, user, async () => role), false);
  }
  assert.equal(await canUseVerifiedAuthSession(oauth, user, async () => "admin"), true);
});

test("email login, confirmation and recovery still work for Google-linked accounts", async () => {
  for (const method of ["password", "otp", "recovery"]) {
    assert.equal(await canUseVerifiedAuthSession({ sub: user.id, amr: [{ method }] }, user, async () => { throw new Error("Email should not need a role lookup"); }), true);
  }
});

test("failed role lookup, mismatched identity and missing profiles fail closed", async () => {
  assert.equal(await canUseVerifiedAuthSession(oauth, user, async () => { throw new Error("Database down"); }), false);
  assert.equal(await canUseVerifiedAuthSession({ ...oauth, sub: "someone-else" }, user, async () => "admin"), false);
  assert.equal(await canUseVerifiedAuthSession({ sub: user.id }, user, async () => null), false);
  assert.equal(await canUseVerifiedAuthSession(oauth, user, async () => "user"), false);
});

test("a demoted admin loses social session access on the next authorization check", async () => {
  let role = "admin";
  assert.equal(await canUseVerifiedAuthSession(oauth, user, async () => role), true);
  role = "user";
  assert.equal(await canUseVerifiedAuthSession(oauth, user, async () => role), false);
});

test("admin UI paths are exact internal paths, never lookalikes or external redirects", () => {
  for (const path of ["/admin", "/admin/tools", "/admin?tab=users"]) assert.equal(isAdminLoginPath(path), true);
  for (const path of [null, "/", "/dashboard", "/register?next=/admin", "/administrator", "//evil.test/admin", "/\\evil.test/admin", "/admin/../dashboard"]) assert.equal(isAdminLoginPath(path), false);
});
