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

import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
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
      aria-pressed={isActive}
      onClick={onClick}
      className={`grid h-[28px] min-w-[30px] place-items-center rounded-[7px] px-2 text-[13px] font-semibold transition ${
        isActive
          ? "bg-[#28a143] text-[#04170c] shadow-[0_0_0_1px_rgba(94,224,140,0.65),0_0_14px_rgba(40,161,67,0.35)]"
          : "bg-white/[0.06] text-white/75 hover:bg-white/10 hover:text-white"
      } ${label === "I" ? "italic" : ""}`}
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
          "w-full min-w-0 max-w-none min-h-[96px] break-words px-3.5 py-3.5 text-[14px] leading-[1.6] text-white focus:outline-none [&_p]:my-1.5 [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_li]:pl-1 [&_li::marker]:text-[#5ee08c] [&_p.is-editor-empty:first-child::before]:text-white/35 [&_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child::before]:float-left [&_p.is-editor-empty:first-child::before]:pointer-events-none [&_p.is-editor-empty:first-child::before]:h-0",
      },
    },
  });

  const toolbarState = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => ({
      bold: currentEditor?.isActive("bold") ?? false,
      italic: currentEditor?.isActive("italic") ?? false,
      bulletList: currentEditor?.isActive("bulletList") ?? false,
    }),
  });

  if (!editor) {
    return (
      <div className="min-h-[140px] w-full min-w-0 rounded-xl bg-white/[0.045] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" />
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl bg-white/[0.045] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)] transition focus-within:bg-white/[0.075] focus-within:shadow-[inset_0_0_0_1px_rgba(61,220,127,0.65),0_0_0_3px_rgba(40,161,67,0.22)]">
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-2.5 py-2">
        <ToolbarButton
          label="B"
          isActive={toolbarState?.bold ?? false}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="I"
          isActive={toolbarState?.italic ?? false}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="•"
          isActive={toolbarState?.bulletList ?? false}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
      </div>
      <EditorContent editor={editor} className="w-full min-w-0" />
    </div>
  );
}