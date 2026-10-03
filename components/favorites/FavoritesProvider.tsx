"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import LoginRequiredDialog from "@/components/auth/LoginRequiredDialog";
import { useFavorites } from "@/lib/favorites/use-favorites";
import type { FavoriteItemType } from "@/lib/favorites/types";

type FavoritesContextValue = {
  ready: boolean;
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (payload: {
    itemId: string;
    itemTitle: string;
    itemSubtitle?: string;
  }) => Promise<{ ok: boolean; favorited?: boolean }>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  itemType,
  children,
}: {
  itemType: FavoriteItemType;
  children: ReactNode;
}) {
  const { ready, isFavorite, toggleFavorite: baseToggle } = useFavorites(itemType);
  const [loginOpen, setLoginOpen] = useState(false);

  const toggleFavorite = useCallback(
    async (payload: { itemId: string; itemTitle: string; itemSubtitle?: string }) => {
      const result = await baseToggle(payload);
      if (result.needsLogin) {
        setLoginOpen(true);
        return { ok: false };
      }
      if (!result.ok) return { ok: false };
      return { ok: true, favorited: result.favorited };
    },
    [baseToggle]
  );

  return (
    <FavoritesContext.Provider value={{ ready, isFavorite, toggleFavorite }}>
      {children}
      <LoginRequiredDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error("useFavoritesContext must be used within FavoritesProvider");
  }
  return ctx;
}
