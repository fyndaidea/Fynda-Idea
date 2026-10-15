"use client";

import { useEffect, useRef, useState } from "react";

/** TODO(auth): replace ALTCHA with Turnstile and enable Supabase CAPTCHA enforcement. */
export function AuthCaptcha({ onVerify }: { onVerify: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let widget: HTMLElement | undefined;
    const change = (event: Event) => {
      const { state, payload } = (event as CustomEvent<{ state: string; payload?: string }>).detail;
      onVerify(state === "verified" && payload ? payload : "");
      setError(state === "error" ? "Verification failed. Please retry the security check." : "");
    };
    void import("altcha").then(() => {
      if (cancelled || !container.current) return;
      widget = document.createElement("altcha-widget");
      widget.setAttribute("challenge", "/api/auth/captcha/challenge");
      widget.setAttribute("auto", "off");
      widget.setAttribute("workers", "2");
      widget.setAttribute("configuration", JSON.stringify({ humanInteractionSignature: false }));
      widget.style.setProperty("--altcha-max-width", "100%");
      widget.style.setProperty("--altcha-border-radius", "12px");
      widget.addEventListener("statechange", change);
      container.current.appendChild(widget);
    }).catch(() => {
      if (!cancelled) { onVerify(""); setError("Security verification could not load. Reload this page to try again."); }
    });
    return () => { cancelled = true; widget?.removeEventListener("statechange", change); widget?.remove(); };
  }, [onVerify]);
  return <div className="w-full" aria-label="Security verification">
    <div ref={container} />
    {error && <p role="alert" className="mt-2 text-sm text-red-600">{error}</p>}
  </div>;
}
