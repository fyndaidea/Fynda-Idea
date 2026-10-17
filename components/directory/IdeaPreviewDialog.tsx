"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MarkdownBody } from "@/components/docs/markdown-body";
import FavoriteButton from "@/components/favorites/FavoriteButton";
import { ShimmerBlock } from "@/components/ui/Shimmer";
import type { IdeaPreviewModel } from "./idea-preview-model";
import "./idea-detail.css";

export function IdeaPreviewDialog({ idea, onClose }: { idea: IdeaPreviewModel; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [details, setDetails] = useState<IdeaPreviewModel | null>(() => typeof idea.body === "string" ? idea : null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const scrollArea = document.querySelector<HTMLElement>("[data-site-scroll]") ?? document.documentElement;
    const previousOverflow = scrollArea.style.overflow;
    scrollArea.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      scrollArea.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (typeof idea.body === "string") return;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch(`/api/ideas/${encodeURIComponent(idea.slug)}`, {
          credentials: "include", signal: controller.signal, cache: "no-store",
        });
        if (!response.ok) throw new Error("Could not load idea");
        const data = await response.json() as { idea?: IdeaPreviewModel };
        if (!data.idea || data.idea.slug !== idea.slug || typeof data.idea.body !== "string") throw new Error("Invalid idea");
        if (!controller.signal.aborted) setDetails(data.idea);
      } catch {
        if (!controller.signal.aborted) setError(true);
      }
    })();
    return () => controller.abort();
  }, [idea.slug, idea.body, retry]);

  if (typeof document === "undefined") return null;
  const current = details ?? idea;
  return createPortal(
    <dialog
      ref={dialogRef}
      className="idea-preview-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
    >
      <div className="idea-preview-bar">
        <span className="idea-eyebrow">Idea preview</span>
        <div className="idea-preview-tools">
          <Link href={`/ideas/${idea.slug}`} className="idea-text-link">Open full page <ArrowUpRight size={15} aria-hidden /></Link>
          <button type="button" onClick={onClose} className="idea-icon-button" aria-label="Close idea preview"><X size={20} aria-hidden /></button>
        </div>
      </div>
      <div className="idea-preview-scroll">
        <header className="idea-preview-heading">
          <div className="idea-labels"><span>Idea</span>{current.featured ? <span>Featured</span> : null}{current.categories?.map((category) => <span key={category}>{category}</span>)}</div>
          <div className="idea-preview-title-row">
            <h2 id={titleId}>{current.title}</h2>
            <FavoriteButton itemId={current.slug} itemTitle={current.title} itemSubtitle={current.summary} />
          </div>
          <p className="idea-lead">{current.summary}</p>
        </header>
        {current.highlights?.length ? <ul className="idea-highlights">{current.highlights.map((item) => <li key={item}>{item}</li>)}</ul> : null}
        <section aria-label="Idea details" aria-busy={!details && !error} className="idea-preview-body">
          {details ? details.body ? <MarkdownBody markdown={details.body} /> : <p className="idea-muted">No additional details have been added yet.</p> : error ? (
            <div role="alert" className="idea-preview-error"><p>Couldn’t load the details. Your place in the list is saved.</p><button type="button" className="idea-text-link" onClick={() => { setError(false); setRetry((value) => value + 1); }}>Try again</button></div>
          ) : (
            <div role="status" aria-label="Loading idea details" className="space-y-3">
              <ShimmerBlock className="h-6 w-40" />
              <ShimmerBlock className="h-4 w-full" /><ShimmerBlock className="h-4 w-full" /><ShimmerBlock className="h-4 w-4/5" />
              <ShimmerBlock className="mt-6 h-32 w-full" rounded="rounded-xl" />
            </div>
          )}
        </section>
        {current.tags?.length ? <ul className="idea-tags" aria-label="Tags">{current.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul> : null}
      </div>
      <footer className="idea-preview-footer"><p>Explore without leaving your list.</p><button type="button" className="idea-secondary-button" onClick={onClose}>Back to ideas</button></footer>
    </dialog>, document.body
  );
}
