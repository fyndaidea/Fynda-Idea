import { createHash, randomBytes } from "crypto";

export function generateApiKey(): { plain: string; prefix: string; hash: string } {
  const secret = randomBytes(24).toString("base64url");
  const plain = `sk_live_${secret}`;
  const prefix = plain.slice(0, 16);
  const hash = createHash("sha256").update(plain, "utf8").digest("hex");
  return { plain, prefix, hash };
}
