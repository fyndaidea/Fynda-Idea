"use client";

import { AuthProvider } from "@/lib/auth-context";
import { FavoritesProvider } from "@/components/favorites/FavoritesProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <FavoritesProvider itemType="idea">{children}</FavoritesProvider>
    </AuthProvider>
  );
}
