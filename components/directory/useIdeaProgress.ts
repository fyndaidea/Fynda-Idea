"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { isIdeaProgressStatus, type IdeaProgressStatus } from "@/lib/ideas/progress";

export type IdeaStageSeed = { userId: string; status: IdeaProgressStatus | null; scope?: "notion" | "personal"; revision?: string };
type Snapshot = {
  statuses: Record<string, IdeaProgressStatus | null>;
  loaded: Record<string, boolean>;
  pending: Record<string, boolean>;
  errors: Record<string, string | undefined>;
  scope?: "notion" | "personal";
};
const empty: Snapshot = { statuses: {}, loaded: {}, pending: {}, errors: {} };
type Store = { snapshot: Snapshot; listeners: Set<() => void>; queued: Set<string>; seeds: Record<string, string>; versions: Record<string, number>; timer?: ReturnType<typeof setTimeout>; request?: Promise<void> };
const stores = new Map<string, Store>();
function storeFor(userId: string) {
  let store = stores.get(userId);
  if (!store) { store = { snapshot: empty, listeners: new Set(), queued: new Set(), seeds: {}, versions: {} }; stores.set(userId, store); }
  return store;
}
function publish(store: Store, patch: Partial<Snapshot>) {
  store.snapshot = { ...store.snapshot, ...patch };
  store.listeners.forEach(listener => listener());
}
function queueLoad(userId: string, ideaId: string) {
  const store = storeFor(userId);
  store.queued.add(ideaId);
  if (store.timer || store.request) return;
  store.timer = setTimeout(() => {
    store.timer = undefined;
    const ids = [...store.queued].slice(0, 100);
    ids.forEach(id => store.queued.delete(id));
    const versions = Object.fromEntries(ids.map(id => [id, store.versions[id] ?? 0]));
    store.request = (async () => {
      try {
        const response = await fetch(`/api/idea-progress?scope=effective&ideaIds=${ids.join(",")}`, { credentials: "include", cache: "no-store" });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load your status.");
        if (data.userId !== userId || !["notion", "personal"].includes(data.scope)) throw new Error("Account changed. Reload to see your status.");
        const statuses = { ...store.snapshot.statuses }, loaded = { ...store.snapshot.loaded }, errors = { ...store.snapshot.errors };
        for (const id of ids) {
          if ((store.versions[id] ?? 0) !== versions[id] || store.snapshot.pending[id]) continue;
          const status: unknown = data.statuses?.[id];
          if ((status === null || isIdeaProgressStatus(status)) && !data.errors?.[id]) {
            statuses[id] = status; loaded[id] = true; errors[id] = undefined;
          } else errors[id] = data.errors?.[id] || "Could not verify this idea’s status.";
        }
        publish(store, { statuses, loaded, errors, scope: data.scope });
      } catch (error) {
        const errors = { ...store.snapshot.errors };
        for (const id of ids) if ((store.versions[id] ?? 0) === versions[id]) errors[id] = error instanceof Error ? error.message : "Could not load your status.";
        publish(store, { errors });
      } finally {
        store.request = undefined;
        if (store.queued.size) queueLoad(userId, [...store.queued][0]);
      }
    })();
  }, 0);
}

/** Visible cards, previews and details share account-scoped values and batched authoritative reads. */
export function useIdeaProgress(userId: string | undefined, ideaId: string, initial?: IdeaStageSeed) {
  const subscribe = useCallback((listener: () => void) => {
    if (!userId) return () => {};
    const store = storeFor(userId); store.listeners.add(listener);
    return () => { store.listeners.delete(listener); };
  }, [userId]);
  const getSnapshot = useCallback(() => userId ? storeFor(userId).snapshot : empty, [userId]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => empty);
  const seedKey = initial ? initial.revision ?? JSON.stringify([initial.userId, ideaId, initial.status, initial.scope]) : undefined;
  useEffect(() => {
    if (!userId || !initial || initial.userId !== userId || !seedKey) return;
    const store = storeFor(userId);
    if (store.seeds[ideaId] !== seedKey && !store.snapshot.pending[ideaId]) {
      store.seeds[ideaId] = seedKey;
      publish(store, { statuses: { ...store.snapshot.statuses, [ideaId]: initial.status }, loaded: { ...store.snapshot.loaded, [ideaId]: true }, errors: { ...store.snapshot.errors, [ideaId]: undefined }, scope: initial.scope });
    }
  }, [userId, ideaId, seedKey, initial]);
  useEffect(() => { if (userId && !initial) queueLoad(userId, ideaId); }, [userId, ideaId, initial]);
  const retry = () => { if (userId) queueLoad(userId, ideaId); };
  const save = async (status: IdeaProgressStatus | null) => {
    if (!userId) return false;
    const store = storeFor(userId);
    if (store.snapshot.pending[ideaId]) return false;
    store.versions[ideaId] = (store.versions[ideaId] ?? 0) + 1;
    publish(store, { pending: { ...store.snapshot.pending, [ideaId]: true }, errors: { ...store.snapshot.errors, [ideaId]: undefined } });
    try {
      const response = await fetch("/api/idea-progress", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ideaId, status, expectedUserId: userId }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save your status.");
      if (data.status !== null && !isIdeaProgressStatus(data.status)) throw new Error("Invalid status response");
      // An admin cannot clear the shared stage; the menu only offers concrete Notion stages.
      publish(store, { statuses: { ...store.snapshot.statuses, [ideaId]: data.status }, loaded: { ...store.snapshot.loaded, [ideaId]: true } });
      window.dispatchEvent(new CustomEvent("idea-stage-saved", { detail: { userId, ideaId, status: data.status } }));
      return true;
    } catch (error) {
      publish(store, { errors: { ...store.snapshot.errors, [ideaId]: error instanceof Error ? error.message : "Could not save your status." } });
      // A remote write may have succeeded before local persistence failed. Reconcile on retry.
      return false;
    } finally {
      publish(store, { pending: { ...store.snapshot.pending, [ideaId]: false } });
    }
  };
  return {
    status: snapshot.loaded[ideaId] ? snapshot.statuses[ideaId] : initial?.status ?? null,
    ready: Boolean(snapshot.loaded[ideaId]) || initial !== undefined,
    scope: snapshot.scope ?? initial?.scope,
    busy: snapshot.pending[ideaId] ?? false,
    error: snapshot.errors[ideaId], save, retry,
  };
}
