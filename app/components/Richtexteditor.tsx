"use client";

/**
 * Richtexteditor — minimal Tiptap wrapper for the problem-statement body
 * text in Clientdetails2.tsx. Deliberately small: bold, italic, and a
 * bullet list are the only formatting this needs, matching the style of
 * the hand-written callouts in earlier proposals (bold lead-in sentence +
 * plain paragraph, occasionally a short list).
 *
 * Requires: npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder
 *
 * Stores/returns content as an HTML string (editor.getHTML()) rather than
 * Markdown or JSON — that's what Moduleoverview.tsx renders directly via
 * dangerouslySetInnerHTML into the proposal callout. If you'd rather store
 * something else (e.g. Tiptap's JSON doc format), change the onUpdate below
 * and the render side together.
 *
 * `immediatelyRender: false` is required in Next.js — without it, Tiptap
 * renders once on the server and once on the client and React throws a
 * hydration mismatch. This is a known Tiptap+Next.js gotcha, not optional.
 */

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

export interface RichTextEditorProps {
  /** HTML string. Pass "" for an empty editor. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
        isActive
          ? "bg-[#137a3c]/15 text-[#137a3c]"
          : "text-[#0c3d20]/60 hover:bg-[#0c3d20]/5 hover:text-[#0c3d20]"
      }`}
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false, // headings aren't part of this format — bold/italic/list only
      }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[120px] px-4 py-3 text-[#0c3d20] focus:outline-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_li]:my-0.5",
      },
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[164px] rounded-lg border border-[#0c3d20]/15 bg-white" />
    );
  }

  return (
    <div className="rounded-lg border border-[#0c3d20]/15 bg-white transition focus-within:border-[#137a3c] focus-within:ring-2 focus-within:ring-[#137a3c]/20">
      <div className="flex items-center gap-1 border-b border-[#0c3d20]/10 bg-[#f9faf9] px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="• List"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}