"use client";

import { Pencil } from "lucide-react";
import type { Idea } from "@/lib/db/ideas-db";
import type { IdeaSectionEdit } from "@/lib/ideas/section-edit";
import { IdeaSectionEditor, type IdeaCategoryOption } from "./IdeaSectionEditor";

const SECTIONS: { section: IdeaSectionEdit["section"]; label: string }[] = [
  { section: "overview", label: "Overview" },
  { section: "body", label: "Details" },
  { section: "highlights", label: "Key points" },
  { section: "metadata", label: "Categories and tags" },
];

export function IdeaEditMenu({ onChoose }: { onChoose: (section: IdeaSectionEdit["section"]) => void }) {
  return (
    <details className="ideas-edit-menu">
      <summary className="idea-edit-link"><Pencil size={13} aria-hidden /><span>Edit</span></summary>
      <div className="ideas-edit-panel" role="group" aria-label="Choose a section to edit">
        {SECTIONS.map((item) => (
          <button
            key={item.section}
            type="button"
            onClick={(event) => {
              onChoose(item.section);
              event.currentTarget.closest("details")?.removeAttribute("open");
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
    </details>
  );
}

export function IdeaSectionEditForm({
  idea,
  section,
  categories,
  onSaved,
  onCancel,
}: {
  idea: Idea;
  section: IdeaSectionEdit["section"];
  categories: IdeaCategoryOption[];
  onSaved: (idea: Idea) => void;
  onCancel: () => void;
}) {
  return (
    <IdeaSectionEditor
      idea={idea}
      section={section}
      categories={categories}
      onCancel={onCancel}
      onSave={async (edit) => {
        const response = await fetch(`/api/admin/ideas/${idea.id}/sections`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(edit),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.idea) throw new Error(data.error || "Could not save this section.");
        onSaved(data.idea as Idea);
      }}
    />
  );
}
