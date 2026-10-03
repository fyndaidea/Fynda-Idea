"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { FavoriteItemType } from "@/lib/favorites/types";

export function useFavorites(itemType: FavoriteItemType) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setIds(new Set());
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    (async () => {
      try {
        const res = await fetch(`/api/favorites?type=${encodeURIComponent(itemType)}`, {
          credentials: "include",
        });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          favorites?: Array<{ item_id: string }>;
        };
        if (cancelled) return;
        setIds(new Set((data.favorites ?? []).map((f) => f.item_id)));
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, itemType]);

  const isFavorite = useCallback((itemId: string) => ids.has(itemId), [ids]);

  const toggleFavorite = useCallback(
    async (payload: { itemId: string; itemTitle: string; itemSubtitle?: string }) => {
      if (!user) return { ok: false as const, needsLogin: true as const };

      const favorited = ids.has(payload.itemId);
      const res = await fetch("/api/favorites", {
        method: favorited ? "DELETE" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType,
          itemId: payload.itemId,
          itemTitle: payload.itemTitle,
          itemSubtitle: payload.itemSubtitle ?? null,
        }),
      });

      if (!res.ok) return { ok: false as const, needsLogin: false as const };

      setIds((prev) => {
        const next = new Set(prev);
        if (favorited) next.delete(payload.itemId);
        else next.add(payload.itemId);
        return next;
      });
      return { ok: true as const, needsLogin: false as const, favorited: !favorited };
    },
    [user, itemType, ids]
  );

  return { ready, isFavorite, toggleFavorite, user };
}
