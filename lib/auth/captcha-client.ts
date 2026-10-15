"use client";

import { AuthError, type Session, type SupabaseClient, type User } from "@supabase/supabase-js";

type Credentials = { email: string; password?: string; options?: { data?: Record<string, unknown>; emailRedirectTo?: string; redirectTo?: string; captchaToken?: string } };

/** Email credentials are submitted only after the server consumes a valid ALTCHA proof. */
export function createCaptchaAuth(supabase: SupabaseClient, altcha?: string) {
  async function submit(action: string, credentials: Credentials) {
    try {
      const response = await fetch("/api/auth/email", {
        method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email: credentials.email, password: credentials.password,
          name: credentials.options?.data?.full_name,
          redirectTo: credentials.options?.emailRedirectTo ?? credentials.options?.redirectTo, altcha }),
      });
      const result = await response.json() as { error?: string; data?: { user: User | null; session: Session | null } };
      if (!response.ok || result.error) return { data: { user: null, session: null }, error: new AuthError(result.error ?? "Unable to continue. Please try again.") };
      const data = result.data ?? { user: null, session: null };
      if (data.session) {
        const { error } = await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
        if (error) return { data: { user: null, session: null }, error };
      }
      return { data, error: null };
    } catch {
      return { data: { user: null, session: null }, error: new AuthError("Unable to continue. Please try again.") };
    }
  }
  return {
    signInWithPassword: (credentials: Credentials) => submit("login", credentials),
    signUp: (credentials: Credentials) => submit("register", credentials),
    signInWithOtp: (credentials: Credentials) => submit("magic-link", credentials),
    resetPasswordForEmail: (email: string, options?: Credentials["options"]) => submit("forgot-password", { email, options }),
  };
}
