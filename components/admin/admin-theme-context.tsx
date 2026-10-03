"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AdminAppearance = "dark" | "light";

const STORAGE_KEY = "fynda-admin-theme";

type AdminThemeContextValue = {
  theme: AdminAppearance;
  setTheme: (theme: AdminAppearance) => void;
  toggleTheme: () => void;
};

const AdminThemeContext = createContext<AdminThemeContextValue | null>(null);

function readStoredTheme(): AdminAppearance {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark") return raw;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminAppearance>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setThemeState(readStoredTheme());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme, ready]);

  const setTheme = useCallback((next: AdminAppearance) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>
  );
}

/** Returns theme controls inside admin; `null` on the public site (truthy check for portaled UI). */
export function useAdminTheme() {
  return useContext(AdminThemeContext);
}

/** True when rendered inside admin chrome (for portaled UI). */
export function useIsAdminThemeScope() {
  return useContext(AdminThemeContext) != null;
}

/** Wrap portaled UI so admin CSS variables apply outside the shell. */
export function AdminThemeScope({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(AdminThemeContext);
  const theme = ctx?.theme ?? "dark";
  return (
    <div
      data-admin
      data-admin-theme={theme}
      className={`text-[color:var(--foreground)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}
