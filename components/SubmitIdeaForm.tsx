"use client";

import { useMemo, useState } from "react";
import {
  SearchableMultiSelect,
  useCategoryOptions,
} from "@/components/ui/SearchableMultiSelect";
import {
  btnPrimaryClass,
  inputClass,
  labelClass,
  panelClass,
  textareaClass,
} from "@/lib/ui-classes";
import { toast } from "@/lib/toast";

export default function SubmitIdeaForm() {
  const { options: categoryOptions, loading: categoriesLoading } = useCategoryOptions();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const errors = useMemo(() => {
    const e: string[] = [];
    if (!title.trim()) e.push("Title is required.");
    if (!summary.trim()) e.push("Summary is required.");
    return e;
  }, [title, summary]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (errors.length) {
      toast.error(errors[0]!);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim(),
          body: body.trim(),
          category: categories
            .map((id) => categoryOptions.find((o) => o.value === id)?.label ?? id)
            .filter(Boolean)
            .join(", "),
          submitter_email: email.trim(),
          submitter_name: name.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed");
      }
      toast.success("Idea submitted for review.");
      setDone(true);
      setTitle("");
      setSummary("");
      setBody("");
      setCategories([]);
      setName("");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`${panelClass} p-6 sm:p-8`}>
      {done ? (
        <p className="mb-6 rounded-xl border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-4 py-3 text-sm">
          Thanks — we&apos;ll review your submission soon.
        </p>
      ) : null}
      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block">
          <span className={labelClass}>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={`mt-1.5 ${inputClass}`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Summary</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
            rows={3}
            className={`mt-1.5 ${textareaClass}`}
          />
        </label>
        <label className="block">
          <span className={labelClass}>Details</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className={`mt-1.5 ${textareaClass}`}
          />
        </label>
        <SearchableMultiSelect
          label="Categories"
          options={categoryOptions}
          value={categories}
          onChange={setCategories}
          placeholder={categoriesLoading ? "Loading categories…" : "Select categories…"}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
          <label className="block">
            <span className={labelClass}>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className={`mt-1.5 ${inputClass}`}
            />
          </label>
        </div>
        <button type="submit" disabled={busy} className={btnPrimaryClass}>
          {busy ? "Submitting…" : "Submit idea"}
        </button>
      </form>
    </div>
  );
}
