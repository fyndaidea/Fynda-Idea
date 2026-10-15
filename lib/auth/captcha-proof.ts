import { createChallenge, verifySolution, pbkdf2, type Payload } from "altcha/lib";
import { normalizeCaptchaToken } from "./auth-captcha";

export const CAPTCHA_TTL_SECONDS = 600;
export async function newCaptchaChallenge(secret: string, app: string, now = Date.now()) {
  return createChallenge({ algorithm: "PBKDF2/SHA-256", cost: 1000, keyLength: 32, keyPrefixLength: 2,
    counter: 200 + Math.floor(Math.random() * 600), deriveKey: pbkdf2.deriveKey,
    expiresAt: new Date(now + CAPTCHA_TTL_SECONDS * 1000), hmacSignatureSecret: secret, data: { app } });
}

/** Verify cryptographically before touching replay storage or accepting auth credentials. */
export async function verifyCaptchaProof(value: unknown, secret: string, app: string,
  consume: (signature: string, expiresAt: number) => Promise<boolean>): Promise<boolean> {
  const token = normalizeCaptchaToken(value);
  if (!token || !/^[A-Za-z0-9+/]+={0,2}$/.test(token)) return false;
  let payload: Payload;
  try {
    payload = JSON.parse(Buffer.from(token, "base64").toString("utf8"));
    const p = payload.challenge?.parameters;
    if (!p || !payload.solution || p.algorithm !== "PBKDF2/SHA-256" || p.cost !== 1000 || p.keyLength !== 32 ||
      p.data?.app !== app || !p.expiresAt || p.expiresAt > Date.now() / 1000 + CAPTCHA_TTL_SECONDS + 5 ||
      typeof payload.challenge.signature !== "string" || payload.challenge.signature.length !== 64) return false;
    const result = await verifySolution({ challenge: payload.challenge, solution: payload.solution,
      hmacSignatureSecret: secret, deriveKey: pbkdf2.deriveKey });
    if (!result.verified) return false;
  } catch { return false; }
  return consume(payload.challenge.signature!, payload.challenge.parameters.expiresAt!);
}
