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
};

function toolbarMouseDown(e: React.MouseEvent) {
  e.preventDefault();
}

export function EmailHtmlEditor({
  editorRef,
  colors,
  defaultHtml,
  minHeightClass = "min-h-[280px]",
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

  return (
    <>
      <div
        className="flex flex-wrap gap-1 rounded-lg border border-gray-200 bg-gray-50 p-2"
        onMouseDown={toolbarMouseDown}
      >
        <button
          type="button"
          onMouseDown={toolbarMouseDown}
          onClick={() => exec("bold")}
          className="rounded px-2 py-1 text-xs font-bold hover:bg-white"
        >
          B
        </button>
        <button
          type="button"
          onMouseDown={toolbarMouseDown}
          onClick={() => exec("italic")}
          className="rounded px-2 py-1 text-xs italic hover:bg-white"
        >
          I
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            toolbarMouseDown(e);
            cacheSelection();
          }}
          onClick={addLink}
          className="rounded px-2 py-1 text-xs underline hover:bg-white"
        >
          Link
        </button>
        <span className="mx-1 text-gray-300">|</span>
        <button
          type="button"
          onMouseDown={toolbarMouseDown}
          onClick={() => applyColor(colors.text.body)}
          className="rounded px-2 py-1 text-xs hover:bg-white"
          style={{ color: colors.text.body }}
        >
          Text
        </button>
        <button
          type="button"
          onMouseDown={toolbarMouseDown}
          onClick={() => applyColor(colors.green)}
          className="rounded px-2 py-1 text-xs hover:bg-white"
          style={{ color: colors.green }}
        >
          Main
        </button>
        <button
          type="button"
          onMouseDown={toolbarMouseDown}
          onClick={() => applyColor(colors.accent)}
          className="rounded px-2 py-1 text-xs hover:bg-white"
          style={{ color: colors.accent }}
        >
          Accent 3
        </button>
        <button
          type="button"
          onMouseDown={toolbarMouseDown}
          onClick={() => applyColor("#ffffff")}
          className="rounded bg-brand-green px-2 py-1 text-xs text-white hover:opacity-90"
        >
          On green
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onMouseUp={cacheSelection}
        onKeyUp={cacheSelection}
        className={`${minHeightClass} rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm leading-relaxed text-brand-text focus:outline-none focus:ring-2 focus:ring-brand-green/30`}
        suppressContentEditableWarning
      />
    </>
  );
}
