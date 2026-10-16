"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import LoginRequiredDialog from "@/components/auth/LoginRequiredDialog";
import { useFavorites, type InitialFavorites } from "@/lib/favorites/use-favorites";
import type { FavoriteItemType } from "@/lib/favorites/types";

type FavoritesContextValue = {
  ready: boolean;
  revision: number;
  userId: string | null;
  refreshFavorites: () => void;
  isPending: (itemId: string) => boolean;
  isFavorite: (itemId: string) => boolean;
  toggleFavorite: (payload: {
    itemId: string;
    itemTitle: string;
    itemSubtitle?: string;
  }) => Promise<{ ok: boolean; favorited?: boolean; needsLogin?: boolean }>;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({
  itemType,
  children,
  initial,
}: {
  itemType: FavoriteItemType;
  children: ReactNode;
  initial?: InitialFavorites;
}) {
  const parent = useContext(FavoritesContext);
  const refreshParent = parent?.refreshFavorites;
  const { ready, isFavorite, isPending, revision, userId, refreshFavorites, toggleFavorite: baseToggle } = useFavorites(itemType, initial);
  const [loginOpen, setLoginOpen] = useState(false);

  const toggleFavorite = useCallback(
    async (payload: { itemId: string; itemTitle: string; itemSubtitle?: string }) => {
      const result = await baseToggle(payload);
      if (result.needsLogin) {
        setLoginOpen(true);
        return { ok: false, needsLogin: true };
      }
      if (!result.ok) return { ok: false };
      refreshParent?.();
      return { ok: true, favorited: result.favorited };
    },
    [baseToggle, refreshParent]
  );

  return (
    <FavoritesContext.Provider value={{ ready, isFavorite, isPending, revision, userId, refreshFavorites, toggleFavorite }}>
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
