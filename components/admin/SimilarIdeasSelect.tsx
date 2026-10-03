"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchableMultiSelect } from "@/components/ui/SearchableMultiSelect";

export function SimilarIdeasSelect({
  name = "idea_slugs",
  label = "Ideas in this collection",
  defaultValue = [],
  excludeSlug,
  onChange,
}: {
  name?: string;
  label?: string;
  defaultValue?: string[];
  excludeSlug?: string;
  onChange?: (value: string[]) => void;
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ideas?pageSize=100", { credentials: "include" });
      const data = (await res.json().catch(() => ({}))) as {
        ideas?: Array<{ slug: string; title: string }>;
      };
      const list = Array.isArray(data.ideas) ? data.ideas : [];
      setOptions(
        list
          .filter((t) => t.slug && t.slug !== excludeSlug)
          .map((t) => ({ value: t.slug, label: t.title }))
      );
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [excludeSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SearchableMultiSelect
      name={name}
      label={label}
      options={options}
      defaultValue={defaultValue}
      onChange={onChange}
      placeholder={loading ? "Loading ideas…" : "Select ideas"}
      onRefresh={load}
      refreshing={loading}
    />
  );
}
