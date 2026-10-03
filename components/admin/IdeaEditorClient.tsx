"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminBtnPrimaryClass,
  adminInputClass,
  adminLabelClass,
  adminTextareaClass,
} from "@/lib/admin/ui-classes";
import { toast } from "@/lib/toast";

type Props = {
  mode: "create" | "edit";
  idea?: {
    id: string;
    title: string;
    slug: string;
    summary: string;
    body: string;
    status: string;
    featured: boolean;
    score: number;
    categoryIds: string[];
    tags: string[];
    highlights: string[];
    authorName: string | null;
  };
  categories: Array<{ id: string; name: string }>;
};

export default function IdeaEditorClient({ mode, idea, categories }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState(idea?.title ?? "");
  const [slug, setSlug] = useState(idea?.slug ?? "");
  const [summary, setSummary] = useState(idea?.summary ?? "");
  const [body, setBody] = useState(idea?.body ?? "");
  const [status, setStatus] = useState(idea?.status ?? "draft");
  const [featured, setFeatured] = useState(idea?.featured ?? false);
  const [score, setScore] = useState(idea?.score ?? 50);
  const [authorName, setAuthorName] = useState(idea?.authorName ?? "");
  const [tags, setTags] = useState((idea?.tags ?? []).join(", "));
  const [highlights, setHighlights] = useState((idea?.highlights ?? []).join("\n"));
  const [categoryIds, setCategoryIds] = useState<string[]>(idea?.categoryIds ?? []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const payload = {
      title,
      slug: slug || undefined,
      summary,
      body,
      status,
      featured,
      score: Number(score) || 50,
      author_name: authorName || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      highlights: highlights
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean),
      category_ids: categoryIds,
    };
    try {
      const res = await fetch(
        mode === "create" ? "/api/admin/ideas" : `/api/admin/ideas/${idea!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      toast.success("Saved");
      router.push("/admin/ideas");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={save}
      className="admin-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3 sm:px-4"
    >
      <h1 className="text-lg font-semibold">
        {mode === "create" ? "New idea" : "Edit idea"}
      </h1>

      <label className="block">
        <span className={adminLabelClass}>Title</span>
        <input
          className={`mt-1.5 ${adminInputClass}`}
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="block">
        <span className={adminLabelClass}>Slug</span>
        <input
          className={`mt-1.5 ${adminInputClass}`}
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto from title"
        />
      </label>

      <label className="block">
        <span className={adminLabelClass}>Summary</span>
        <textarea
          className={`mt-1.5 ${adminTextareaClass}`}
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
      </label>

      <label className="block">
        <span className={adminLabelClass}>Body (markdown)</span>
        <textarea
          className={`mt-1.5 ${adminTextareaClass}`}
          rows={10}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={adminLabelClass}>Status</span>
          <select
            className={`mt-1.5 ${adminInputClass}`}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>
        <label className="block">
          <span className={adminLabelClass}>Score</span>
          <input
            type="number"
            className={`mt-1.5 ${adminInputClass}`}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
          />
        </label>
        <label className="mt-7 flex items-center gap-2 text-[13px] font-medium">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
          />
          Featured
        </label>
      </div>

      <label className="block">
        <span className={adminLabelClass}>Author</span>
        <input
          className={`mt-1.5 ${adminInputClass}`}
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
        />
      </label>

      <label className="block">
        <span className={adminLabelClass}>Tags (comma-separated)</span>
        <input
          className={`mt-1.5 ${adminInputClass}`}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </label>

      <label className="block">
        <span className={adminLabelClass}>Highlights (one per line)</span>
        <textarea
          className={`mt-1.5 ${adminTextareaClass}`}
          rows={4}
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
        />
      </label>

      <fieldset>
        <legend className={adminLabelClass}>Categories</legend>
        <div className="mt-2 flex flex-wrap gap-3">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-1.5 text-[13px]">
              <input
                type="checkbox"
                checked={categoryIds.includes(c.id)}
                onChange={(e) =>
                  setCategoryIds((prev) =>
                    e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)
                  )
                }
              />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={busy} className={adminBtnPrimaryClass}>
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
