"use client";

import { RefreshCw, Pencil } from "lucide-react";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnchoredDropdownPortal } from "@/components/ui/AnchoredDropdownPortal";
import { useFormFieldClasses } from "@/lib/admin/use-form-field-classes";

export type SearchableSelectOption = { value: string; label: string };

function selectionKey(values: string[]) {
  return values.join("\x1e");
}

function RefreshIcon() {
  return <RefreshCw className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />;
}

function EditIcon() {
  return <Pencil className="h-3.5 w-3.5" strokeWidth={1.6} aria-hidden="true" />;
}

export function SearchableMultiSelect({
  name,
  label,
  options,
  defaultValue = [],
  value,
  onChange,
  required = false,
  placeholder = "Select…",
  onRefresh,
  refreshing = false,
  headerActions,
  hiddenValueFormat = "csv",
  onCreateOption,
  onEditOption,
  canEditOption,
  createItemNoun,
  extraLabels,
}: {
  name?: string;
  label?: string;
  options: SearchableSelectOption[];
  defaultValue?: string[];
  value?: string[];
  onChange?: (value: string[]) => void;
  required?: boolean;
  placeholder?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  headerActions?: ReactNode;
  hiddenValueFormat?: "csv" | "json";
  /** Opens create flow from the dropdown (e.g. manage dialog create form). */
  onCreateOption?: (query: string) => void;
  /** Opens edit flow for an existing option. */
  onEditOption?: (option: SearchableSelectOption) => void;
  /** When set, controls which options show an edit control. Defaults to all when onEditOption is set. */
  canEditOption?: (option: SearchableSelectOption) => boolean;
  /** Noun used in create CTA, e.g. "category" → "Create category". */
  createItemNoun?: string;
  /** Labels for values not yet present in `options` (e.g. just-created rows). */
  extraLabels?: Record<string, string>;
}) {
  const { input, search, label: labelClassName } = useFormFieldClasses();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internalSelected, setInternalSelected] = useState<string[]>(defaultValue);
  const [rememberedLabels, setRememberedLabels] = useState<Record<string, string>>({});
  const selected = value !== undefined ? value : internalSelected;
  const close = useCallback(() => setOpen(false), []);
  const defaultValueKey = selectionKey(defaultValue);

  useEffect(() => {
    if (value !== undefined) return;
    setInternalSelected((prev) => {
      const prevKey = selectionKey(prev);
      if (prevKey === defaultValueKey) return prev;
      if (prev.length > 0 && defaultValue.length === 0) return prev;
      return defaultValue;
    });
  }, [defaultValueKey, defaultValue, value]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!options.length) return;
    setRememberedLabels((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const option of options) {
        if (next[option.value] !== option.label) {
          next[option.value] = option.label;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [options]);

  const optionMap = new Map(options.map((o) => [o.value, o.label]));
  const resolveLabel = (valueKey: string) =>
    optionMap.get(valueKey) ?? extraLabels?.[valueKey] ?? rememberedLabels[valueKey] ?? null;

  const trimmedQuery = query.trim();
  const filtered = options.filter((o) => o.label.toLowerCase().includes(trimmedQuery.toLowerCase()));
  const exactLabelMatch = options.some((o) => o.label.toLowerCase() === trimmedQuery.toLowerCase());
  const noun = createItemNoun?.trim() || "item";
  const canCreate = Boolean(onCreateOption);
  const showCreateFromQuery = canCreate && trimmedQuery.length > 0 && !exactLabelMatch;
  const emptyLabel = required ? placeholder : "None selected";

  const toggle = (nextValue: string) => {
    const adding = !selected.includes(nextValue);
    if (adding) {
      const known = resolveLabel(nextValue) ?? optionMap.get(nextValue);
      if (known) {
        setRememberedLabels((prev) =>
          prev[nextValue] === known ? prev : { ...prev, [nextValue]: known }
        );
      }
    }
    const next = adding
      ? [...selected, nextValue]
      : selected.filter((v) => v !== nextValue);
    if (onChange) onChange(next);
    else setInternalSelected(next);
  };

  const remove = (nextValue: string) => {
    const next = selected.filter((v) => v !== nextValue);
    if (onChange) onChange(next);
    else setInternalSelected(next);
  };

  const hiddenValue =
    hiddenValueFormat === "json" ? JSON.stringify(selected) : selected.join(",");

  return (
    <div ref={rootRef} className="relative block space-y-1" data-tool-field={name}>
      {label ? (
        <div className="flex min-h-8 items-center justify-between gap-2">
          <span className={labelClassName}>{label}</span>
          {headerActions || onRefresh ? (
            <div className="flex items-center gap-1">
              {headerActions}
              {onRefresh ? (
                <button
                  type="button"
                  onClick={() => onRefresh()}
                  disabled={refreshing}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--card-border)] text-[color:var(--muted)] transition hover:bg-[color:var(--card-muted)] hover:text-[color:var(--foreground)] disabled:opacity-50"
                  aria-label="Refresh options"
                  title="Refresh"
                >
                  <RefreshIcon />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
      {name ? <input type="hidden" name={name} value={hiddenValue} /> : null}
      <div
        ref={triggerRef}
        id={name ? `tool-field-${name}` : listId}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`${input} flex h-auto min-h-8 w-full cursor-pointer items-start justify-between gap-2 py-1.5 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 flex-wrap content-start gap-1.5">
          {selected.length === 0 ? (
            <span className="py-0.5 text-[color:var(--muted)]">{emptyLabel}</span>
          ) : (
            selected.map((valueKey) => {
              const chipLabel = resolveLabel(valueKey) ?? "…";
              return (
                <span
                  key={valueKey}
                  className="inline-flex max-w-full items-center gap-1 rounded-md border border-[color:var(--card-border)] bg-[color:var(--card-muted)] px-1.5 py-0.5 text-[12px] leading-4 text-[color:var(--foreground)]"
                >
                  <span className="min-w-0 truncate">{chipLabel}</span>
                  <button
                    type="button"
                    className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[color:var(--muted)] transition hover:bg-[color:var(--card)] hover:text-[color:var(--foreground)]"
                    aria-label={`Remove ${chipLabel}`}
                    title="Remove"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      remove(valueKey);
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })
          )}
        </span>
        <span aria-hidden className="mt-0.5 shrink-0 text-[color:var(--muted)]">
          ▾
        </span>
      </div>
      <AnchoredDropdownPortal open={open} onClose={close} anchorRef={triggerRef}>
        <div className="border-b border-[color:var(--card-border)] p-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className={search}
            autoFocus
          />
        </div>
        <div role="listbox" aria-labelledby={listId} className="max-h-56 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-2 py-3 text-sm text-[color:var(--muted)]">
              {showCreateFromQuery ? "No matches — create it below." : "No matches."}
            </p>
          ) : (
            filtered.map((option) => {
              const active = selected.includes(option.value);
              return (
                <div
                  key={option.value}
                  className="flex items-center gap-1 rounded-md px-1 py-0.5 hover:bg-[color:var(--card-muted)]"
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-1 py-1 text-[13px] text-[color:var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggle(option.value)}
                      className="h-4 w-4 shrink-0 rounded"
                    />
                    <span className="truncate">{option.label}</span>
                  </label>
                  {onEditOption && (canEditOption?.(option) ?? true) ? (
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[color:var(--muted)] transition hover:bg-[color:var(--card)] hover:text-[color:var(--foreground)]"
                      aria-label={`Edit ${option.label}`}
                      title="Edit"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        close();
                        onEditOption(option);
                      }}
                    >
                      <EditIcon />
                    </button>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        {canCreate ? (
          <div className="border-t border-[color:var(--card-border)] p-2">
            <button
              type="button"
              className="w-full rounded-md px-2 py-1.5 text-left text-[13px] font-semibold text-[color:var(--accent)] hover:bg-[color:var(--card-muted)]"
              onClick={() => {
                close();
                onCreateOption?.(trimmedQuery);
              }}
            >
              {showCreateFromQuery ? `Create “${trimmedQuery}”` : `Create ${noun}`}
            </button>
          </div>
        ) : null}
      </AnchoredDropdownPortal>
    </div>
  );
}

export function SearchableSelect({
  name,
  label,
  options,
  defaultValue = "",
  value,
  onChange,
  required = false,
  placeholder = "Select…",
  headerActions,
  searchable = true,
  extraLabels,
}: {
  name?: string;
  label?: string;
  options: SearchableSelectOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  headerActions?: ReactNode;
  /** When false, hides the search field (useful for short option lists). */
  searchable?: boolean;
  /** Labels for values not yet present in `options` (e.g. just-created rows). */
  extraLabels?: Record<string, string>;
}) {
  const { input, search, label: labelClassName } = useFormFieldClasses();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [rememberedLabels, setRememberedLabels] = useState<Record<string, string>>({});
  const selected = value !== undefined ? value : internalValue;
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (value !== undefined) return;
    setInternalValue((prev) => {
      if (prev === defaultValue) return prev;
      if (prev && !defaultValue) return prev;
      return defaultValue;
    });
  }, [defaultValue, value]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!options.length) return;
    setRememberedLabels((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const option of options) {
        if (next[option.value] !== option.label) {
          next[option.value] = option.label;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [options]);

  const optionMap = new Map(options.map((o) => [o.value, o.label]));
  const resolveLabel = (valueKey: string) =>
    optionMap.get(valueKey) ?? extraLabels?.[valueKey] ?? rememberedLabels[valueKey] ?? null;
  const filtered = options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()));
  const summary = selected ? (resolveLabel(selected) ?? "…") : placeholder;

  const choose = (next: string) => {
    const known = resolveLabel(next) ?? optionMap.get(next);
    if (known) {
      setRememberedLabels((prev) => (prev[next] === known ? prev : { ...prev, [next]: known }));
    }
    if (onChange) onChange(next);
    else setInternalValue(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative block space-y-1" data-tool-field={name}>
      {label ? (
        <div className="flex min-h-8 items-center justify-between gap-2">
          <span className={labelClassName}>{label}</span>
          {headerActions ? <div className="flex items-center gap-1">{headerActions}</div> : null}
        </div>
      ) : null}
      {name ? <input type="hidden" name={name} value={selected} /> : null}
      <button
        ref={triggerRef}
        type="button"
        id={name ? `tool-field-${name}` : listId}
        onClick={() => setOpen(true)}
        className={`${input} flex w-full items-center justify-between gap-2 text-left`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "text-[color:var(--foreground)]" : "text-[color:var(--muted)]"}>
          {summary}
        </span>
        <span aria-hidden className="text-[color:var(--muted)]">
          ▾
        </span>
      </button>
      <AnchoredDropdownPortal
        open={open}
        onClose={close}
        anchorRef={triggerRef}
        minWidth={searchable ? undefined : 72}
      >
        {searchable ? (
          <div className="border-b border-[color:var(--card-border)] p-2">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className={search}
              autoFocus
            />
          </div>
        ) : null}
        <div role="listbox" className="max-h-56 overflow-y-auto p-1">
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => choose(option.value)}
              className={[
                "flex w-full rounded-md px-2 py-1.5 text-left text-[13px] text-[color:var(--foreground)] hover:bg-[color:var(--card-muted)]",
                selected === option.value ? "bg-[color:var(--card-muted)] font-medium" : "",
              ].join(" ")}
            >
              {option.label}
            </button>
          ))}
        </div>
      </AnchoredDropdownPortal>
    </div>
  );
}

export function useCategoryOptions() {
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = (await res.json().catch(() => ({}))) as {
        categories?: Array<{ id: string; name: string }>;
      };
      const list = Array.isArray(data.categories) ? data.categories : [];
      setOptions(list.map((c) => ({ value: String(c.id), label: c.name })));
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { options, loading, refresh: load };
}
