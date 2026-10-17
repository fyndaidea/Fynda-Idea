"use client";

import Link from "next/link";
import { useCallback, useState, type ReactNode } from "react";
import { IdeaPreviewDialog } from "./IdeaPreviewDialog";
import type { IdeaPreviewModel } from "./idea-preview-model";

/** Ordinary clicks preview; modified clicks keep normal link/new-tab behavior. */
export function IdeaPreviewLink({ idea, children, className, "aria-label": label }: {
  idea: IdeaPreviewModel;
  children?: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <Link
        href={`/ideas/${idea.slug}`}
        className={className}
        aria-label={label}
        aria-haspopup="dialog"
        onClick={(event) => {
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          setOpen(true);
        }}
      >
        {children}
      </Link>
      {open ? <IdeaPreviewDialog idea={idea} onClose={close} /> : null}
    </>
  );
}
