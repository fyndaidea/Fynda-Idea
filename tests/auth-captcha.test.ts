import assert from "node:assert/strict";
import test from "node:test";
import { pbkdf2, solveChallenge, type Challenge } from "altcha/lib";
import { newCaptchaChallenge, verifyCaptchaProof } from "../lib/auth/captcha-proof";
import { getAuthCaptchaError, isCaptchaPublicPath, normalizeCaptchaToken } from "../lib/auth/auth-captcha";
import { captchaEmailPOST } from "../lib/auth/captcha-handlers";

const secret = "test-only-secret-do-not-deploy-0123456789";
async function solved(challenge: Challenge) {
  const solution = await solveChallenge({ challenge, deriveKey: pbkdf2.deriveKey });
  assert.ok(solution);
  return Buffer.from(JSON.stringify({ challenge, solution })).toString("base64");
}
test("proof verification accepts a real solution exactly once, including concurrent attempts", async () => {
  const proof = await solved(await newCaptchaChallenge(secret, "test-app"));
  const seen = new Set<string>();
  const consume = async (signature: string) => {
    if (seen.has(signature)) return false;
    seen.add(signature); return true;
  };
  const accepted = await Promise.all([verifyCaptchaProof(proof, secret, "test-app", consume), verifyCaptchaProof(proof, secret, "test-app", consume)]);
  assert.deepEqual(accepted.sort(), [false, true]);
});
test("tampered, cross-app, wrongly signed, and expired proofs never reach replay storage", async () => {
  const challenge = await newCaptchaChallenge(secret, "test-app");
  const proof = await solved(challenge);
  const never = async () => assert.fail("Must not consume an invalid proof");
  assert.equal(await verifyCaptchaProof(proof, secret, "another-app", never), false);
  assert.equal(await verifyCaptchaProof(proof, "another-signing-key-0123456789012345", "test-app", never), false);
  const decoded = JSON.parse(Buffer.from(proof, "base64").toString());
  decoded.solution.derivedKey = "00".repeat(32);
  assert.equal(await verifyCaptchaProof(Buffer.from(JSON.stringify(decoded)).toString("base64"), secret, "test-app", never), false);
  decoded.challenge.parameters.cost = 1;
  assert.equal(await verifyCaptchaProof(Buffer.from(JSON.stringify(decoded)).toString("base64"), secret, "test-app", never), false);
  const expired = await solved(await newCaptchaChallenge(secret, "test-app", Date.now() - 700000));
  assert.equal(await verifyCaptchaProof(expired, secret, "test-app", never), false);
});
test("missing and oversized payloads are rejected", async () => {
  for (const value of [undefined, null, {}, "", "bad payload", "a".repeat(16385), Buffer.from("{}").toString("base64")]) {
    assert.equal(await verifyCaptchaProof(value, secret, "test-app", async () => assert.fail("Must not write")), false);
  }
  assert.equal(normalizeCaptchaToken({}), undefined);
  assert.ok(getAuthCaptchaError(""));
  assert.equal(getAuthCaptchaError("proof"), null);
});
test("public auth exceptions are exact and method specific", () => {
  assert.equal(isCaptchaPublicPath("/api/auth/captcha/challenge", "GET"), true);
  assert.equal(isCaptchaPublicPath("/api/auth/email", "POST"), true);
  for (const path of ["/api/auth/email/extra", "/api/auth/captcha/other", "/api/admin/users", "/api/auth/signout"]) assert.equal(isCaptchaPublicPath(path, "POST"), false);
  assert.equal(isCaptchaPublicPath("/api/auth/email", "GET"), false);
  assert.equal(isCaptchaPublicPath("/api/auth/captcha/challenge", "POST"), false);
});
test("cross-origin, invalid redirect, and malformed email auth requests fail before auth or DB access", async () => {
  const url = "https://fynda.test/api/auth/email";
  const post = (body: string, origin = "https://fynda.test") => captchaEmailPOST(new Request(url, { method: "POST", headers: { origin, "Content-Type": "application/json" }, body }));
  assert.equal((await post("{}", "https://evil.test")).status, 403);
  assert.equal((await post("broken-json")).status, 400);
  assert.equal((await post(JSON.stringify({ action: "admin", email: "person@example.com" }))).status, 400);
  assert.equal((await post(JSON.stringify({ action: "login", email: "person@example.com", password: "password", redirectTo: "https://evil.test/auth/callback" }))).status, 400);
  assert.equal((await post(JSON.stringify({ action: "register", email: "person@example.com", password: "password", redirectTo: "https://fynda.test/auth/callback?next=//evil.test" }))).status, 400);
  assert.equal((await post(JSON.stringify({ action: "register", email: "person@example.com", password: "password", redirectTo: "invalid-url" }))).status, 400);
  assert.equal((await post(JSON.stringify({ action: "register", email: "person@example.com", password: "password", redirectTo: "https://fynda.test/auth/callback?next=%2F%09%2Fevil.test" }))).status, 400);
});
