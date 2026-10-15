export function normalizeCaptchaToken(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const token = value.trim();
  return token && token.length <= 16384 ? token : undefined;
}

export function getAuthCaptchaError(token: unknown): string | null {
  return normalizeCaptchaToken(token) ? null : "Complete the security verification and try again.";
}

export function isCaptchaPublicPath(path: string, method: string): boolean {
  return (path === "/api/auth/captcha/challenge" && (method === "GET" || method === "HEAD")) ||
    (["/api/auth/email", "/api/auth/token", "/api/auth/register"].includes(path) && method === "POST");
}
