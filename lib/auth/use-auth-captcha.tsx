"use client";

import { useState } from "react";
import { AuthCaptcha } from "@/components/auth/AuthCaptcha";
import { normalizeCaptchaToken } from "./auth-captcha";

export function useAuthCaptcha(enabled = true) {
  const [token, setToken] = useState("");
  const [generation, setGeneration] = useState(0);
  function reset() { setToken(""); setGeneration(value => value + 1); }
  async function run<T>(action: () => Promise<T>): Promise<T> {
    try { return await action(); } finally { reset(); }
  }
  return {
    token: normalizeCaptchaToken(token),
    ready: !enabled || Boolean(normalizeCaptchaToken(token)),
    element: enabled ? <AuthCaptcha key={generation} onVerify={setToken} /> : null,
    reset, run,
  };
}
