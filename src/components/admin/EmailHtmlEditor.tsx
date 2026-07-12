"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  execEditorCommand,
  getSelectionRangeIn,
  insertLinkInEditor,
} from "@/lib/email/editor-selection";

import type { BrandColors } from "@/lib/site-config/types";

type EmailHtmlEditorProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  colors: BrandColors;
  defaultHtml?: string;
  minHeightClass?: string;
  /** Match Sidemark-style dark email shell in the editor */
  darkCanvas?: boolean;
};

function toolbarMouseDown(e: React.MouseEvent) {
  e.preventDefault();
}

function ToolButton({
  onClick,
  title,
  children,
  className = "",
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={toolbarMouseDown}
      onClick={onClick}
      className={`rounded px-2 py-1 text-xs hover:bg-white ${className}`}
    >
      {children}
    </button>
  );
}

export function EmailHtmlEditor({
  editorRef,
  colors,
  defaultHtml,
  minHeightClass = "min-h-[280px]",
  darkCanvas = true,
}: EmailHtmlEditorProps) {
  const savedRangeRef = useRef<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && defaultHtml && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = defaultHtml;
    }
  }, [defaultHtml, editorRef]);

  function cacheSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    savedRangeRef.current = getSelectionRangeIn(editor);
  }

  function exec(cmd: string, value?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    execEditorCommand(editor, cmd, value, savedRangeRef.current);
    cacheSelection();
  }

  function applyColor(color: string) {
    exec("foreColor", color);
  }

  function addLink() {
    const editor = editorRef.current;
    if (!editor) return;

    const url = prompt("Link URL (include https:// or paste a full address)");
    if (url === null) return;

    const trimmed = url.trim();
    if (!trimmed) return;

    insertLinkInEditor(editor, trimmed, savedRangeRef.current);
    cacheSelection();
  }

  const canvasClass = darkCanvas
    ? `${minHeightClass} rounded-lg border border-white/20 px-12 py-10 text-base leading-relaxed text-white focus:outline-none focus:ring-2 focus:ring-white/30 [&_a]:underline [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-7 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-7 [&_li]:my-1 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold`
    : `${minHeightClass} rounded-lg border border-gray-300 bg-white px-12 py-10 text-sm leading-relaxed text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-green/30 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-7 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-7 [&_li]:my-1`;

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 p-2"
        onMouseDown={toolbarMouseDown}
      >
        <ToolButton title="Bold" onClick={() => exec("bold")} className="font-bold">
          B
        </ToolButton>
        <ToolButton title="Italic" onClick={() => exec("italic")} className="italic">
          I
        </ToolButton>
        <ToolButton
          title="Underline"
          onClick={() => exec("underline")}
          className="underline"
        >
          U
        </ToolButton>
        <ToolButton
          title="Insert link"
          onClick={addLink}
          className="underline"
        >
          Link
        </ToolButton>

        <span className="mx-1 text-gray-300">|</span>

        <ToolButton title="Heading" onClick={() => exec("formatBlock", "h2")}>
          H2
        </ToolButton>
        <ToolButton title="Subheading" onClick={() => exec("formatBlock", "h3")}>
          H3
        </ToolButton>
        <ToolButton title="Paragraph" onClick={() => exec("formatBlock", "p")}>
          ¶
        </ToolButton>

        <span className="mx-1 text-gray-300">|</span>

        <ToolButton
          title="Bullet list"
          onClick={() => exec("insertUnorderedList")}
        >
          • List
        </ToolButton>
        <ToolButton
          title="Numbered list"
          onClick={() => exec("insertOrderedList")}
        >
          1. List
        </ToolButton>

        <span className="mx-1 text-gray-300">|</span>

        <ToolButton title="Align left" onClick={() => exec("justifyLeft")}>
          Left
        </ToolButton>
        <ToolButton title="Align center" onClick={() => exec("justifyCenter")}>
          Center
        </ToolButton>
        <ToolButton title="Align right" onClick={() => exec("justifyRight")}>
          Right
        </ToolButton>

        <span className="mx-1 text-gray-300">|</span>

        <button
          type="button"
          title="Default text color"
          onMouseDown={toolbarMouseDown}
          onClick={() => applyColor(darkCanvas ? "#ffffff" : colors.text.body)}
          className="rounded px-2 py-1 text-xs font-medium hover:bg-white"
          style={{ color: darkCanvas ? colors.green : colors.text.body }}
        >
          Text
        </button>
        <button
          type="button"
          title="Main brand color"
          onMouseDown={toolbarMouseDown}
          onClick={() => applyColor(colors.green)}
          className="rounded px-2 py-1 text-xs hover:bg-white"
          style={{ color: colors.green }}
        >
          Main
        </button>
        <button
          type="button"
          title="Cream / light"
          onMouseDown={toolbarMouseDown}
          onClick={() => applyColor(colors.cream)}
          className="rounded px-2 py-1 text-xs hover:bg-white"
          style={{ color: colors.cream }}
        >
          Cream
        </button>
        <button
          type="button"
          title="Accent color"
          onMouseDown={toolbarMouseDown}
          onClick={() => applyColor(colors.accent)}
          className="rounded px-2 py-1 text-xs hover:bg-white"
          style={{ color: colors.accent }}
        >
          Accent
        </button>
        <button
          type="button"
          title="White text"
          onMouseDown={toolbarMouseDown}
          onClick={() => applyColor("#ffffff")}
          className="rounded bg-brand-green px-2 py-1 text-xs text-white hover:opacity-90"
        >
          White
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onMouseUp={cacheSelection}
        onKeyUp={cacheSelection}
        className={canvasClass}
        style={darkCanvas ? { backgroundColor: colors.green } : undefined}
        suppressContentEditableWarning
      />
      <p className="text-xs text-gray-500">
        Logo appears at the top of every email automatically. Use Center for
        headlines and CTAs; use lists for steps.
      </p>
    </>
  );
}
