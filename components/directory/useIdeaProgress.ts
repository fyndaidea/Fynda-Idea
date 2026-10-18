"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { isIdeaProgressStatus, type IdeaProgress, type IdeaProgressStatus } from "@/lib/ideas/progress";

type Snapshot = {
  loaded: boolean;
  statuses: Record<string, IdeaProgressStatus>;
  saved: Record<string, IdeaProgressStatus | null>;
  pending: Record<string, boolean>;
  errors: Record<string, string | undefined>;
  error?: string;
};
const empty: Snapshot = { loaded: false, statuses: {}, saved: {}, pending: {}, errors: {} };
type Store = { snapshot: Snapshot; listeners: Set<() => void>; request?: Promise<void>; version: number };
const stores = new Map<string, Store>();
function storeFor(userId: string) {
  let store = stores.get(userId);
  if (!store) { store = { snapshot: empty, listeners: new Set(), version: 0 }; stores.set(userId, store); }
  return store;
}
function publish(store: Store, patch: Partial<Snapshot>) {
  store.snapshot = { ...store.snapshot, ...patch };
  store.listeners.forEach((listener) => listener());
}
function load(userId: string) {
  const store = storeFor(userId);
  if (store.request) return store.request;
  const version = store.version;
  store.request = (async () => {
    try {
      const response = await fetch("/api/idea-progress", { credentials: "include", cache: "no-store" });
      if (!response.ok) throw new Error("Could not load your status.");
      const data = await response.json() as { userId: string; progress: IdeaProgress[] };
      if (data.userId !== userId) throw new Error("Account changed");
      if (!Array.isArray(data.progress)) throw new Error("Invalid status response");
      const statuses: Snapshot["statuses"] = {};
      for (const item of data.progress) if (isIdeaProgressStatus(item.status)) statuses[item.ideaId] = item.status;
      // A read started before a save must never restore the older value.
      if (store.version === version) publish(store, { loaded: true, statuses, saved: {}, error: undefined });
    } catch {
      if (store.version === version) publish(store, { error: "Could not load your status." });
    } finally {
      store.request = undefined;
      if (store.version !== version && store.listeners.size) void load(userId);
    }
  })();
  return store.request;
}

/** One account-scoped read for all visible cards and previews; saves update both. */
export function useIdeaProgress(userId: string | undefined, ideaId: string, initial?: IdeaProgressStatus | null) {
  const subscribe = useCallback((listener: () => void) => {
    if (!userId) return () => {};
    const store = storeFor(userId);
    store.listeners.add(listener);
    return () => { store.listeners.delete(listener); };
  }, [userId]);
  const getSnapshot = useCallback(() => userId ? storeFor(userId).snapshot : empty, [userId]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => empty);
  useEffect(() => { if (userId) void load(userId); }, [userId]);
  const retry = () => { if (userId) void load(userId); };
  const save = async (status: IdeaProgressStatus | null) => {
    if (!userId) return false;
    const store = storeFor(userId);
    if (store.snapshot.pending[ideaId]) return false;
    store.version += 1;
    publish(store, { pending: { ...store.snapshot.pending, [ideaId]: true }, errors: { ...store.snapshot.errors, [ideaId]: undefined } });
    try {
      const response = await fetch("/api/idea-progress", {
        method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId, status, expectedUserId: userId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save your status.");
      if (data.status !== null && !isIdeaProgressStatus(data.status)) throw new Error("Invalid status response");
      const statuses = { ...store.snapshot.statuses };
      if (data.status === null) delete statuses[ideaId]; else statuses[ideaId] = data.status;
      publish(store, { statuses, saved: { ...store.snapshot.saved, [ideaId]: data.status } });
      return true;
    } catch (error) {
      publish(store, { errors: { ...store.snapshot.errors, [ideaId]: error instanceof Error ? error.message : "Could not save your status." } });
      return false;
    } finally {
      store.version += 1;
      publish(store, { pending: { ...store.snapshot.pending, [ideaId]: false } });
    }
  };
  const saved = Object.prototype.hasOwnProperty.call(snapshot.saved, ideaId);
  return {
    status: saved ? snapshot.saved[ideaId] : snapshot.loaded ? snapshot.statuses[ideaId] ?? null : initial ?? null,
    ready: saved || snapshot.loaded || initial !== undefined,
    busy: snapshot.pending[ideaId] ?? false,
    error: snapshot.errors[ideaId] ?? snapshot.error,
    save, retry,
  };
}
