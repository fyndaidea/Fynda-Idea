import { AdminLoadingState } from "./AdminLoadingState";

/** Shown in the admin content area while the server resolves auth + page data. */
export function AdminMainFallback() {
  return <AdminLoadingState label="Loading…" />;
}
