"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, ArrowUpDown, ListFilter, Search } from "lucide-react";
import { SearchableSelect } from "@/components/ui/SearchableMultiSelect";
import { AdminThemeScope } from "@/components/admin/admin-theme-context";
import { AdminViewSwitcher } from "@/components/admin/AdminViewSwitcher";
import { useAdminViewMode } from "@/components/admin/useAdminViewMode";
import { adminBtnPrimaryClass, adminBtnSecondaryClass, adminSearchInputClass } from "@/lib/admin/ui-classes";

const FILTER_POPUP_W = 224; // tailwind w-56

type Props<TData> = {
  title?: string;
  description?: string;
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  globalSearchPlaceholder?: string;
  pageSize?: number;
  /** Expand table body to fill remaining viewport height (admin list pages). */
  fillHeight?: boolean;
  primaryAction?: { label: string; onClick: () => void };
  /** Persisted table/grid toggle key (enables view switcher). */
  viewStorageKey?: string;
  /** Custom card renderer for grid view. */
  renderGridCard?: (row: TData) => ReactNode;
  /** Initial column filters (e.g. from URL params). */
  initialColumnFilters?: ColumnFiltersState;
  /** Keep one column fixed to each horizontal edge while scrolling. */
  stickyColumns?: {
    left?: string;
    leftWidth?: number;
    right?: string;
    rightWidth?: number;
  };
  /** When set, pagination and search are controlled by the parent (server-side lists). */
  serverPagination?: {
    pageIndex: number;
    pageSize: number;
    total: number;
    loading?: boolean;
    globalFilter: string;
    onGlobalFilterChange: (value: string) => void;
    onPageChange: (pageIndex: number) => void;
    onPageSizeChange: (pageSize: number) => void;
  };
};

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  return (
    <span className="inline-flex opacity-80">
      {dir === "asc" ? (
        <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      ) : dir === "desc" ? (
        <ArrowDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
      )}
    </span>
  );
}

function FilterIcon({ active }: { active: boolean }) {
  return (
    <ListFilter
      className={["h-4 w-4", active ? "text-[color:var(--accent)]" : "text-[color:var(--muted)]"].join(" ")}
      strokeWidth={1.75}
      aria-hidden="true"
    />
  );
}

export function DataTable<TData>({
  title,
  description,
  data,
  columns,
  globalSearchPlaceholder = "Search…",
  pageSize = 20,
  fillHeight = false,
  primaryAction,
  viewStorageKey,
  renderGridCard,
  initialColumnFilters = [],
  stickyColumns,
  serverPagination,
}: Props<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(initialColumnFilters);
  const [clientGlobalFilter, setClientGlobalFilter] = useState("");
  const [openFilterFor, setOpenFilterFor] = useState<string | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<{ top: number; left: number } | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const [viewMode, setViewMode] = useAdminViewMode(viewStorageKey ?? "admin-default");
  const showViewSwitcher = Boolean(viewStorageKey);

  useEffect(() => {
    if (!initialColumnFilters.length) return;
    setColumnFilters(initialColumnFilters);
  }, [initialColumnFilters]);

  const defaultGridCard = useCallback(
    (row: TData) => {
      const dataColumn = columns.find(
        (column) => "accessorKey" in column && column.id !== "actions" && typeof column.accessorKey === "string"
      );
      const key =
        dataColumn && "accessorKey" in dataColumn && typeof dataColumn.accessorKey === "string"
          ? dataColumn.accessorKey
          : null;
      const titleValue = key ? String((row as Record<string, unknown>)[key] ?? "") : "Item";
      return (
        <div className="flex h-full flex-col rounded-xl border border-[color:var(--card-border)] bg-[color:var(--card)] p-4">
          <p className="truncate text-[14px] font-semibold text-[color:var(--foreground)]">{titleValue}</p>
        </div>
      );
    },
    [columns]
  );

  const gridRenderer = renderGridCard ?? defaultGridCard;

  const closeColumnFilter = useCallback(() => {
    setOpenFilterFor(null);
    setFilterAnchor(null);
  }, []);

  const defaultData = useMemo(() => data, [data]);
  const server = serverPagination;
  const pagination = server
    ? { pageIndex: server.pageIndex, pageSize: server.pageSize }
    : undefined;
  const globalFilter = server ? server.globalFilter : clientGlobalFilter;
  const setGlobalFilter = server ? server.onGlobalFilterChange : setClientGlobalFilter;
  const pageCount = server
    ? Math.max(1, Math.ceil(server.total / Math.max(1, server.pageSize)))
    : undefined;

  const table = useReactTable({
    data: defaultData,
    columns,
    state: { sorting, columnFilters, ...(server ? {} : { globalFilter }), ...(pagination ? { pagination } : {}) },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: server ? undefined : setClientGlobalFilter,
    enableMultiSort: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
    ...(server
      ? {
          manualPagination: true,
          pageCount,
          onPaginationChange: (updater) => {
            const current: PaginationState = { pageIndex: server.pageIndex, pageSize: server.pageSize };
            const next = typeof updater === "function" ? updater(current) : updater;
            if (next.pageSize !== current.pageSize) {
              server.onPageSizeChange(next.pageSize);
              return;
            }
            if (next.pageIndex !== current.pageIndex) {
              server.onPageChange(next.pageIndex);
            }
          },
        }
      : {}),
  });

  const sortingCount = table.getState().sorting.length;
  const visibleRows = table.getRowModel().rows;
  const canPrev = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const totalRows = server ? server.total : table.getFilteredRowModel().rows.length;
  const rangeStart = visibleRows.length
    ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1
    : 0;
  const rangeEnd =
    table.getState().pagination.pageIndex * table.getState().pagination.pageSize + visibleRows.length;

  const scrollListToTop = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, left: el.scrollLeft });
  }, []);

  useEffect(() => {
    if (!openFilterFor) return;
    const el = tableScrollRef.current;
    if (!el) return;
    const onScroll = () => closeColumnFilter();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [openFilterFor, closeColumnFilter]);

  useEffect(() => {
    if (!openFilterFor) return;
    const onResize = () => closeColumnFilter();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [openFilterFor, closeColumnFilter]);

  const rootClass = fillHeight ? "flex min-h-0 flex-1 flex-col gap-2" : "space-y-3";

  return (
    <div className={rootClass}>
      {(title || description) && (
        <div>
          {title ? (
            <h1 className="text-2xl font-semibold tracking-tight text-[color:var(--foreground)] dark:text-[color:var(--foreground)]">
              {title}
            </h1>
          ) : null}
          {description ? (
            <p className="mt-2 text-sm text-[color:var(--muted)] dark:text-[color:var(--muted)]">{description}</p>
          ) : null}
        </div>
      )}

      <div className="flex w-full shrink-0 items-center gap-3">
        <div className="relative min-w-0 max-w-md flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[color:var(--muted)]">
            <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <input
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={globalSearchPlaceholder}
            className={`${adminSearchInputClass} pl-9 pr-4`}
          />
        </div>
        {showViewSwitcher || primaryAction ? (
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {showViewSwitcher ? <AdminViewSwitcher value={viewMode} onChange={setViewMode} /> : null}
            {primaryAction ? (
              <button type="button" onClick={primaryAction.onClick} className={`${adminBtnPrimaryClass} shrink-0`}>
                {primaryAction.label}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className={fillHeight ? "relative min-h-0 flex-1" : "relative"}>
        <div
          ref={tableScrollRef}
          className={[
            "admin-scrollbar rounded-md border border-[color:var(--card-border)] bg-[color:var(--card)] [scrollbar-gutter:stable] overscroll-x-none overscroll-y-none",
            fillHeight ? "h-full overflow-auto" : "max-h-[65vh] overflow-auto",
          ].join(" ")}
        >
        {viewMode === "grid" && showViewSwitcher ? (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {visibleRows.length > 0 ? (
              visibleRows.map((row) => (
                <div key={row.id} className="min-h-[7rem]">
                  {gridRenderer(row.original)}
                </div>
              ))
            ) : (
              <div className="col-span-full px-4 py-10 text-center text-sm text-[color:var(--muted)]">
                No items found.
              </div>
            )}
          </div>
        ) : (
        <table className="w-full whitespace-nowrap border-separate border-spacing-0 text-left text-[13px]">
          <thead className="text-[color:var(--muted)]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const canMultiSort = header.column.getCanMultiSort();
                  const dir = header.column.getIsSorted();
                  const sortPriorityIndex = header.column.getSortIndex();
                  const canFilter = header.column.getCanFilter();
                  const isFilterOpen = openFilterFor === header.id;
                  const isFilterActive = Boolean(header.column.getFilterValue());
                  const isStickyLeft = header.column.id === stickyColumns?.left;
                  const isStickyRight = header.column.id === stickyColumns?.right;
                  return (
                    <th
                      key={header.id}
                      style={
                        isStickyLeft && stickyColumns?.leftWidth
                          ? {
                              width: stickyColumns.leftWidth,
                              minWidth: stickyColumns.leftWidth,
                              maxWidth: stickyColumns.leftWidth,
                            }
                          : isStickyRight && stickyColumns?.rightWidth
                            ? {
                                width: stickyColumns.rightWidth,
                                minWidth: stickyColumns.rightWidth,
                                maxWidth: stickyColumns.rightWidth,
                              }
                            : undefined
                      }
                      className={[
                        "sticky top-0 z-20 border-b border-[color:var(--card-border)] bg-[color:var(--card)] py-2 text-[11px] font-medium uppercase tracking-[0.06em]",
                        isStickyLeft
                          ? "left-0 z-30 px-3"
                          : "",
                        isStickyRight
                          ? "right-0 z-30 pl-5 pr-3"
                          : isStickyLeft ? "" : "px-3",
                      ].join(" ")}
                    >
                      {header.isPlaceholder ? null : (
                        <div className={canSort || canFilter ? "flex items-center justify-between gap-2" : ""}>
                          <span className="truncate">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>

                          {canSort || canFilter ? (
                          <div className="relative flex shrink-0 items-center gap-1">
                            {canSort ? (
                              <div className="relative inline-flex">
                                <button
                                  type="button"
                                  onClick={(e) => header.column.getToggleSortingHandler()?.(e)}
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)]"
                                  aria-label={
                                    canMultiSort
                                      ? `Sort ${String(header.column.id)}. Hold Shift and click to add as a secondary sort.`
                                      : `Sort ${String(header.column.id)}`
                                  }
                                  title={
                                    canMultiSort
                                      ? "Sort column (Shift+click: add multi-sort)"
                                      : "Sort column"
                                  }
                                >
                                  <SortIcon dir={dir} />
                                </button>
                                {dir && sortingCount > 1 && sortPriorityIndex >= 0 ? (
                                  <span
                                    className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[color:var(--accent)] px-0.5 text-[10px] font-bold leading-none text-white shadow-sm"
                                    aria-hidden
                                  >
                                    {sortPriorityIndex + 1}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}

                            {canFilter ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (openFilterFor === header.id) {
                                    closeColumnFilter();
                                    return;
                                  }
                                  const r = e.currentTarget.getBoundingClientRect();
                                  setFilterAnchor({
                                    top: r.bottom + 8,
                                    left: Math.max(8, r.right - FILTER_POPUP_W),
                                  });
                                  setOpenFilterFor(header.id);
                                }}
                                className={[
                                  "inline-flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-[color:var(--card-muted)]",
                                  isFilterActive ? "text-[color:var(--accent)]" : "text-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                                ].join(" ")}
                                aria-label={`Filter ${String(header.column.id)}`}
                                title="Filter"
                              >
                                <FilterIcon active={isFilterActive} />
                              </button>
                            ) : null}

                            {canFilter &&
                            isFilterOpen &&
                            filterAnchor &&
                            typeof document !== "undefined"
                              ? createPortal(
                                  <AdminThemeScope>
                                  <>
                                    <div
                                      className="fixed inset-0 z-[199]"
                                      aria-hidden
                                      onMouseDown={(event) => {
                                        event.preventDefault();
                                        closeColumnFilter();
                                      }}
                                    />
                                    <div
                                      role="dialog"
                                      aria-label={`Filter ${String(header.column.id)}`}
                                      style={{
                                        position: "fixed",
                                        top: filterAnchor.top,
                                        left: filterAnchor.left,
                                        width: FILTER_POPUP_W,
                                      }}
                                      className="z-[200] rounded-md border border-[color:var(--card-border)] bg-[color:var(--card)] p-2 shadow-xl shadow-black/40"
                                      onMouseDown={(event) => event.stopPropagation()}
                                    >
                                    <input
                                      autoFocus
                                      value={(header.column.getFilterValue() as string) ?? ""}
                                      onChange={(e) => header.column.setFilterValue(e.target.value)}
                                      placeholder="Type to filter…"
                                      className={`${adminSearchInputClass} h-8 px-2.5`}
                                    />
                                    <div className="mt-2 flex items-center justify-between gap-2">
                                      <button
                                        type="button"
                                        onClick={() => header.column.setFilterValue("")}
                                        className="text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                                      >
                                        Clear
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => closeColumnFilter()}
                                        className="text-xs font-semibold text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                                      >
                                        Done
                                      </button>
                                    </div>
                                    </div>
                                  </>
                                  </AdminThemeScope>,
                                  document.body
                                )
                              : null}
                          </div>
                          ) : null}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.id} className="group border-t border-[color:var(--card-border)] transition hover:bg-[color:var(--card-muted)]/60">
                {row.getVisibleCells().map((cell) => {
                  const isStickyLeft = cell.column.id === stickyColumns?.left;
                  const isStickyRight = cell.column.id === stickyColumns?.right;
                  return (
                    <td
                      key={cell.id}
                      style={
                        isStickyLeft && stickyColumns?.leftWidth
                          ? {
                              width: stickyColumns.leftWidth,
                              minWidth: stickyColumns.leftWidth,
                              maxWidth: stickyColumns.leftWidth,
                            }
                          : isStickyRight && stickyColumns?.rightWidth
                            ? {
                                width: stickyColumns.rightWidth,
                                minWidth: stickyColumns.rightWidth,
                                maxWidth: stickyColumns.rightWidth,
                              }
                            : undefined
                      }
                      className={[
                        "py-2 align-middle",
                        isStickyLeft
                          ? "sticky left-0 z-10 bg-[color:var(--card)] px-3 group-hover:bg-[color:var(--card-muted)]"
                          : "",
                        isStickyRight
                          ? "sticky right-0 z-10 bg-[color:var(--card)] pl-5 pr-3 group-hover:bg-[color:var(--card-muted)]"
                          : isStickyLeft ? "" : "px-3",
                      ].join(" ")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-10 text-center text-sm text-[color:var(--muted)]"
                  colSpan={table.getAllLeafColumns().length}
                >
                  No items found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        )}
        </div>
        {viewMode !== "grid" && stickyColumns?.left && stickyColumns.leftWidth ? (
          <span
            className="pointer-events-none absolute inset-y-px z-20 w-px bg-[color:var(--card-border)]"
            style={{ left: stickyColumns.leftWidth }}
            aria-hidden
          />
        ) : null}
        {viewMode !== "grid" && stickyColumns?.right && stickyColumns.rightWidth ? (
          <span
            className="pointer-events-none absolute inset-y-px z-20 w-px bg-[color:var(--card-border)]"
            style={{ right: stickyColumns.rightWidth }}
            aria-hidden
          />
        ) : null}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-[12px] text-[color:var(--muted)]">
          Showing{" "}
          <span className="font-semibold text-[color:var(--foreground)]">{rangeStart}</span>
          {" "}
          –{" "}
          <span className="font-semibold text-[color:var(--foreground)]">{rangeEnd}</span>
          {" "}
          of <span className="font-semibold text-[color:var(--foreground)]">{totalRows}</span>
          {server?.loading ? <span className="ml-2 text-[color:var(--muted-2)]">Updating…</span> : null}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted)]">
            <span className="text-[color:var(--muted)]">Rows</span>
            <SearchableSelect
              options={[10, 20, 50, 100].map((n) => ({ value: String(n), label: String(n) }))}
              value={String(table.getState().pagination.pageSize)}
              onChange={(v) => {
                table.setPageSize(Number(v));
                scrollListToTop();
              }}
              searchable={false}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              table.previousPage();
              scrollListToTop();
            }}
            disabled={!canPrev}
            className={`${adminBtnSecondaryClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => {
              table.nextPage();
              scrollListToTop();
            }}
            disabled={!canNext}
            className={`${adminBtnSecondaryClass} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

