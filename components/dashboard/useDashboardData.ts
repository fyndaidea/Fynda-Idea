"use client";

import { useEffect, useState } from "react";
import type { FavoriteRow } from "@/lib/favorites/types";

export type DashboardData = {
  favorites: FavoriteRow[];
  loading: boolean;
  error: string | null;
};

export function useDashboardData(): DashboardData {
  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const favRes = await fetch("/api/favorites", { credentials: "include" });
        if (cancelled) return;
        if (!favRes.ok && favRes.status === 401) {
          setError("Please sign in again.");
          return;
        }
        if (favRes.ok) {
          const data = (await favRes.json()) as { favorites?: FavoriteRow[] };
          setFavorites(data.favorites ?? []);
        }
      } catch {
        if (!cancelled) setError("Failed to load your dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { favorites, loading, error };
}
