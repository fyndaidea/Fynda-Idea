import { AdminLoadingState } from "./AdminLoadingState";

type Props = {
  /** Column headings (kept for call-site compatibility). */
  columns?: string[];
  rowCount?: number;
  loadingLabel?: string;
  fillHeight?: boolean;
};

export function AdminDataTableSkeleton({
  loadingLabel = "Loading…",
  fillHeight = true,
}: Props) {
  return <AdminLoadingState label={loadingLabel} fillHeight={fillHeight} />;
}
