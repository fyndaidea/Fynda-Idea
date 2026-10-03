"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";

export type User = {
  id: string;
  email: string;
  name?: string;
  role?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (
    email: string,
    password: string,
    name: string,
    options?: { confirmNext?: string }
  ) => Promise<{ error: string | null; needsEmailConfirm?: boolean }>;
  signInWithMagicLink: (email: string) => Promise<{ error: string | null }>;
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSupabaseUser(sbUser: SupabaseUser | null): User | null {
  if (!sbUser?.email) return null;
  const meta = sbUser.user_metadata ?? {};
  return {
    id: sbUser.id,
    email: sbUser.email,
    name: meta.full_name ?? meta.name ?? undefined,
    role: meta.role ?? undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const prevUserRef = useRef<User | null>(null);
  const sessionReadyRef = useRef(false);

  const mergeProfile = useCallback(async (base: User) => {
    try {
      const res = await fetch("/api/profile", { credentials: "include" });
      if (!res.ok) return base;
      const data = (await res.json()) as {
        full_name?: string | null;
        role?: string | null;
      };
      return {
        ...base,
        name: data.full_name ?? base.name,
        role: data.role ?? base.role,
      };
    } catch {
      return base;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      let mapped = mapSupabaseUser(data.session?.user ?? null);
      if (mapped) mapped = await mergeProfile(mapped);
      setUser(mapped);
      prevUserRef.current = mapped;
      sessionReadyRef.current = true;
      setLoading(false);
    };
    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      let nextUser = mapSupabaseUser(session?.user ?? null);
      if (nextUser) nextUser = await mergeProfile(nextUser);

      const hadUser = prevUserRef.current !== null;

      if (sessionReadyRef.current) {
        if (event === "SIGNED_IN" && nextUser && !hadUser) {
          toast.success("You're signed in.");
        }
        if (event === "SIGNED_OUT" && !nextUser && hadUser) {
          toast.success("Signed out.");
        }
      }

      prevUserRef.current = nextUser;
      setUser(nextUser);
    });

    return () => subscription.unsubscribe();
  }, [supabase, mergeProfile]);

  const authCallbackUrl = useCallback((nextPath: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
    return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const mapped = mapSupabaseUser(data.session?.user ?? null);
    if (mapped) setUser(await mergeProfile(mapped));
  }, [supabase, mergeProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    [supabase]
  );

  const register = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      options?: { confirmNext?: string }
    ) => {
      const confirmNext = options?.confirmNext ?? "/dashboard";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: authCallbackUrl(confirmNext),
        },
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (
          msg.includes("already registered") ||
          msg.includes("user already exists") ||
          msg.includes("already been registered")
        ) {
          return {
            error:
              "This email is already registered. Check your inbox for a confirmation link, or try signing in.",
          };
        }
        return { error: error.message };
      }

      if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
        return {
          error:
            "This email is already registered. Check your inbox for a confirmation link, or try signing in.",
        };
      }

      if (!data.session) {
        return { error: null, needsEmailConfirm: true };
      }

      return { error: null, needsEmailConfirm: false };
    },
    [supabase, authCallbackUrl]
  );

  const signInWithMagicLink = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: authCallbackUrl("/dashboard") },
      });
      return { error: error?.message ?? null };
    },
    [supabase, authCallbackUrl]
  );

  const resetPasswordForEmail = useCallback(
    async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: authCallbackUrl("/reset-password"),
      });
      return { error: error?.message ?? null };
    },
    [supabase, authCallbackUrl]
  );

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
    } catch {
      /* still attempt client sign-out */
    }
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) await supabase.auth.signOut({ scope: "local" });
    setUser(null);
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        signInWithMagicLink,
        resetPasswordForEmail,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
