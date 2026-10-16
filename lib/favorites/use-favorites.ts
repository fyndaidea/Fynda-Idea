"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import type { FavoriteItemType } from "@/lib/favorites/types";

export type InitialFavorites = { userId: string | null; slugs: string[] };

export function useFavorites(itemType: FavoriteItemType, initial?: InitialFavorites) {
  const { user, loading } = useAuth();
  const seed = useRef(initial);
  const userId = loading ? initial?.userId ?? null : user?.id ?? null;
  const [state, setState] = useState(() => ({
    userId: initial?.userId ?? null,
    ids: new Set(initial?.slugs ?? []),
    loaded: initial !== undefined,
    version: 0,
  }));
  const [loadVersion, setLoadVersion] = useState(0);
  const refreshFavorites = useCallback(() => setLoadVersion((value) => value + 1), []);
  const [revision, setRevision] = useState(0);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const pending = useRef(new Set<string>());
  const writes = useRef(Promise.resolve());
  const owner = useRef(userId);

  useEffect(() => {
    owner.current = userId;
    if (loading) return;
    const controller = new AbortController();
    const load = async () => {
      // The server already loaded these favorites for this exact account.
      if (seed.current?.userId === userId && loadVersion === 0) {
        return;
      }
      seed.current = undefined;
      try {
        if (!userId) {
          setState({ userId: null, ids: new Set(), loaded: true, version: loadVersion });
          return;
        }
        const res = await fetch(`/api/favorites?type=${encodeURIComponent(itemType)}`, {
          credentials: "include", signal: controller.signal, cache: "no-store",
        });
        if (!res.ok) throw new Error("Could not load favorites");
        const data = await res.json() as { favorites?: Array<{ item_id: string }> };
        if (!controller.signal.aborted) {
          setState({ userId, ids: new Set((data.favorites ?? []).map((f) => f.item_id)), loaded: true, version: loadVersion });
        }
      } catch {
        if (!controller.signal.aborted) setState({ userId, ids: new Set(), loaded: true, version: loadVersion });
      }
    };
    void load();
    return () => controller.abort();
  }, [userId, loading, itemType, loadVersion]);

  const ready = state.loaded && state.version === loadVersion && state.userId === userId && (!loading || initial !== undefined);
  const isFavorite = useCallback((itemId: string) => state.userId === userId && state.ids.has(itemId), [state, userId]);
  const isPending = useCallback((itemId: string) => pendingIds.has(itemId), [pendingIds]);

  const toggleFavorite = useCallback(async (payload: { itemId: string; itemTitle: string; itemSubtitle?: string }) => {
    if (!userId) return { ok: false as const, needsLogin: true as const };
    if (!ready || pending.current.has(payload.itemId)) return { ok: false as const, needsLogin: false as const };
    const favorited = state.ids.has(payload.itemId);
    pending.current.add(payload.itemId);
    setPendingIds(new Set(pending.current));
    const update = (saved: boolean) => setState((prev) => {
      if (prev.userId !== userId) return prev;
      const ids = new Set(prev.ids);
      if (saved) ids.add(payload.itemId);
      else ids.delete(payload.itemId);
      return { ...prev, ids };
    });
    update(!favorited);
    // Profile favorites are saved as one JSON value; serialize this client's writes.
    const previous = writes.current;
    let release!: () => void;
    writes.current = new Promise<void>((resolve) => { release = resolve; });
    await previous;
    try {
      if (owner.current !== userId) throw new Error("Account changed");
      const res = await fetch("/api/favorites", {
        method: favorited ? "DELETE" : "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, ...payload, itemSubtitle: payload.itemSubtitle ?? null }),
      });
      if (!res.ok) throw new Error("Could not save favorite");
      if (owner.current === userId) setRevision((value) => value + 1);
      return { ok: true as const, needsLogin: false as const, favorited: !favorited };
    } catch {
      update(favorited);
      return { ok: false as const, needsLogin: false as const };
    } finally {
      release();
      pending.current.delete(payload.itemId);
      setPendingIds(new Set(pending.current));
    }
  }, [userId, ready, state.ids, itemType]);

  return { ready, isFavorite, isPending, revision, userId, refreshFavorites, toggleFavorite, user };
}
