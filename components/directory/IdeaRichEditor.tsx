"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import {
  Bold, Code, Heading2, Heading3, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, Undo2,
  type LucideIcon,
} from "lucide-react";
import "./idea-rich-editor.css";

/**
 * WYSIWYG editor for an idea's Markdown body. The body stays Markdown on disk (Notion sync and agents
 * write it), so onChange only fires for real edits — an untouched body is never re-serialized.
 */
export default function IdeaRichEditor({
  initialMarkdown,
  onChange,
  label = "Details",
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  label?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] }, link: { openOnClick: false, autolink: true } }),
      TableKit,
      Markdown,
      Placeholder.configure({ placeholder: "Write the idea in detail…" }),
    ],
    content: initialMarkdown,
    contentType: "markdown",
    editorProps: { attributes: { class: "idea-rich-content", "aria-label": label, "aria-multiline": "true", role: "textbox" } },
    onUpdate: ({ editor: current }) => onChange(current.getMarkdown()),
  });

  return (
    <div className="idea-rich-editor">
      {editor ? <Toolbar editor={editor} /> : <div className="idea-rich-toolbar" aria-hidden />}
      <EditorContent editor={editor} className="idea-rich-scroll" />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      code: e.isActive("code"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL (leave empty to remove)", previous ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  const groups: { icon: LucideIcon; label: string; active?: boolean; disabled?: boolean; run: () => void }[][] = [
    [
      { icon: Heading2, label: "Heading", active: state.h2, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { icon: Heading3, label: "Subheading", active: state.h3, run: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    ],
    [
      { icon: Bold, label: "Bold", active: state.bold, run: () => editor.chain().focus().toggleBold().run() },
      { icon: Italic, label: "Italic", active: state.italic, run: () => editor.chain().focus().toggleItalic().run() },
      { icon: Strikethrough, label: "Strikethrough", active: state.strike, run: () => editor.chain().focus().toggleStrike().run() },
      { icon: Code, label: "Inline code", active: state.code, run: () => editor.chain().focus().toggleCode().run() },
      { icon: Link2, label: "Link", active: state.link, run: setLink },
    ],
    [
      { icon: List, label: "Bulleted list", active: state.bullet, run: () => editor.chain().focus().toggleBulletList().run() },
      { icon: ListOrdered, label: "Numbered list", active: state.ordered, run: () => editor.chain().focus().toggleOrderedList().run() },
      { icon: Quote, label: "Quote", active: state.quote, run: () => editor.chain().focus().toggleBlockquote().run() },
      { icon: Minus, label: "Divider", run: () => editor.chain().focus().setHorizontalRule().run() },
    ],
    [
      { icon: Undo2, label: "Undo", disabled: !state.canUndo, run: () => editor.chain().focus().undo().run() },
      { icon: Redo2, label: "Redo", disabled: !state.canRedo, run: () => editor.chain().focus().redo().run() },
    ],
  ];

  return (
    <div className="idea-rich-toolbar" role="toolbar" aria-label="Formatting">
      {groups.map((group, index) => (
        <div key={index} className="idea-rich-group">
          {group.map(({ icon: Icon, label, active, disabled, run }) => (
            <button
              key={label}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={active ?? undefined}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={run}
            >
              <Icon size={15} strokeWidth={1.75} aria-hidden />
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
