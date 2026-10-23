import assert from "node:assert/strict";
import test from "node:test";
import { canUseVerifiedAuthSession } from "../lib/auth/social-login-policy";

const user = { id: "verified-user" };

test("Google (oauth) sessions are allowed for every user, not only admins", () => {
  assert.equal(canUseVerifiedAuthSession({ sub: user.id, amr: [{ method: "oauth" }] } as { sub: string }, user), true);
});

test("email, otp and recovery sessions still work", () => {
  for (const method of ["password", "otp", "recovery"]) {
    assert.equal(canUseVerifiedAuthSession({ sub: user.id, amr: [{ method }] } as { sub: string }, user), true);
  }
});

test("mismatched or missing subject fails closed", () => {
  assert.equal(canUseVerifiedAuthSession({ sub: "someone-else" }, user), false);
  assert.equal(canUseVerifiedAuthSession({}, user), false);
  assert.equal(canUseVerifiedAuthSession({ sub: "" }, { id: "" }), false);
});
