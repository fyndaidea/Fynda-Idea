"use client";

import { useCallback, useEffect, useState } from "react";

export type AdminViewMode = "table" | "grid";

export function useAdminViewMode(storageKey: string) {
  const [viewMode, setViewMode] = useState<AdminViewMode>("table");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`admin-view:${storageKey}`);
      if (stored === "grid" || stored === "table") {
        setViewMode(stored);
      }
    } catch {
      // ignore localStorage errors
    }
  }, [storageKey]);

  const setMode = useCallback(
    (mode: AdminViewMode) => {
      setViewMode(mode);
      try {
        localStorage.setItem(`admin-view:${storageKey}`, mode);
      } catch {
        // ignore localStorage errors
      }
    },
    [storageKey]
  );

  return [viewMode, setMode] as const;
}
