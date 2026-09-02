"use client";

import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import {
  applyHrefToLinkMark,
  applyInlineStyle,
  applyParagraphSpacing,
  closestAnchor,
  execEditorCommand,
  getSelectionRangeIn,
  markLinkSelection,
  removeAnchorKeepText,
  unwrapLinkMarks,
  updateAnchorHref,
} from "@/lib/email/editor-selection";

import type { BrandColors } from "@/lib/site-config/types";

type EmailHtmlEditorProps = {
  editorRef: RefObject<HTMLDivElement | null>;
  colors: BrandColors;
  defaultHtml?: string;
  minHeightClass?: string;
  placeholder?: string;
  onChange?: (html: string) => void;
  extraToolbar?: ReactNode;
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
      className={`rounded px-2 py-1 text-xs text-gray-800 hover:bg-white ${className}`}
    >
      {children}
    </button>
  );
}

function ToolbarMenu({
  label,
  open,
  onToggle,
  options,
  onPick,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  options: { value: string; label: string }[];
  onPick: (value: string) => void;
}) {
  return (
    <div className="relative">
      <ToolButton
        title={label}
        onClick={onToggle}
        className={open ? "bg-white" : ""}
      >
        {label} ▾
      </ToolButton>
      {open ? (
        <div className="absolute left-0 top-full z-30 mt-0.5 min-w-[9rem] rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onMouseDown={toolbarMouseDown}
              onClick={() => onPick(opt.value)}
              className="block w-full px-3 py-1.5 text-left text-xs text-gray-800 hover:bg-gray-100"
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function editorLooksEmpty(html: string): boolean {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").trim() === "";
}

const COLOR_ROWS = [
  ["#000000", "#434343", "#666666", "#999999", "#b7b7b7", "#cccccc", "#d9d9d9", "#ffffff"],
  ["#980000", "#ff0000", "#ff9900", "#ffff00", "#00ff00", "#00ffff", "#4a86e8", "#0000ff"],
  ["#e6b8af", "#f4cccc", "#fce5cd", "#fff2cc", "#d9ead3", "#d0e0e3", "#c9daf8", "#d9d2e9"],
  ["#dd7e6b", "#ea9999", "#f9cb9c", "#ffe599", "#b6d7a8", "#a2c4c9", "#a4c2f4", "#b4a7d6"],
  ["#cc4125", "#e06666", "#f6b26b", "#ffd966", "#93c47d", "#76a5af", "#6d9eeb", "#8e7cc3"],
  ["#a61c00", "#cc0000", "#e69138", "#f1c232", "#6aa84f", "#45818e", "#3c78d8", "#674ea7"],
  ["#85200c", "#990000", "#b45f06", "#bf9000", "#38761d", "#134f5c", "#1155cc", "#351c75"],
  ["#5b0f00", "#660000", "#783f04", "#7f6000", "#274e13", "#0c343d", "#1c4587", "#20124d"],
];

function ColorSwatch({
  color,
  title,
  onPick,
}: {
  color: string;
  title: string;
  onPick: (color: string) => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={toolbarMouseDown}
      onClick={() => onPick(color)}
      className="h-4 w-4 rounded-sm border border-black/15"
      style={{ backgroundColor: color }}
    />
  );
}

function ColorGrid({
  label,
  onPick,
}: {
  label: string;
  onPick: (color: string) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-gray-700">{label}</p>
      <div className="flex flex-col gap-0.5">
        {COLOR_ROWS.map((row) => (
          <div key={row.join()} className="flex gap-0.5">
            {row.map((color) => (
              <ColorSwatch
                key={`${label}-${color}`}
                color={color}
                title={color}
                onPick={onPick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmailHtmlEditor({
  editorRef,
  colors,
  defaultHtml,
  minHeightClass = "min-h-[22rem]",
  placeholder = "Write your email…",
  onChange,
  extraToolbar,
}: EmailHtmlEditorProps) {
  const savedRangeRef = useRef<Range | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inspectedLinkRef = useRef<HTMLAnchorElement | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [colorOpen, setColorOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [spacingOpen, setSpacingOpen] = useState(false);
  const [linkChip, setLinkChip] = useState<{
    href: string;
    top: number;
    left: number;
  } | null>(null);
  const [empty, setEmpty] = useState(() =>
    editorLooksEmpty(defaultHtml ?? ""),
  );

  useLayoutEffect(() => {
    if (editorRef.current && defaultHtml && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = defaultHtml;
      setEmpty(editorLooksEmpty(defaultHtml));
    }
  }, [defaultHtml, editorRef]);

  function cacheSelection() {
    const editor = editorRef.current;
    if (!editor) return;
    const range = getSelectionRangeIn(editor);
    if (range) savedRangeRef.current = range;
  }

  function showLinkChip(anchor: HTMLAnchorElement) {
    const wrap = wrapRef.current;
    if (!wrap) return;
    inspectedLinkRef.current = anchor;
    const wrapRect = wrap.getBoundingClientRect();
    const aRect = anchor.getBoundingClientRect();
    setLinkChip({
      href: anchor.getAttribute("href") || anchor.href,
      top: aRect.bottom - wrapRect.top + 6,
      left: Math.max(0, aRect.left - wrapRect.left),
    });
    setColorOpen(false);
  }

  function hideLinkChip() {
    inspectedLinkRef.current = null;
    setLinkChip(null);
  }

  function onEditorClick(e: React.MouseEvent<HTMLDivElement>) {
    const editor = editorRef.current;
    if (!editor) return;
    const anchor = closestAnchor(e.target, editor);
    if (anchor) {
      e.preventDefault();
      showLinkChip(anchor);
      return;
    }
    hideLinkChip();
  }

  function startChangeLink() {
    const anchor = inspectedLinkRef.current;
    if (!anchor) return;
    setLinkUrl(anchor.getAttribute("href") || anchor.href);
    setLinkChip(null);
    setLinkOpen(true);
    setColorOpen(false);
  }

  function removeInspectedLink() {
    const editor = editorRef.current;
    const anchor = inspectedLinkRef.current;
    if (!anchor || !editor?.contains(anchor)) {
      hideLinkChip();
      return;
    }
    removeAnchorKeepText(anchor);
    hideLinkChip();
    emitChange();
  }

  function openLinkBox() {
    hideLinkChip();
    const editor = editorRef.current;
    cacheSelection();
    if (editor) {
      markLinkSelection(editor, savedRangeRef.current);
      emitChange();
    }
    setLinkOpen(true);
    setColorOpen(false);
    setSizeOpen(false);
    setSpacingOpen(false);
  }

  function closeLinkBox() {
    const editor = editorRef.current;
    if (editor) {
      unwrapLinkMarks(editor);
      emitChange();
    }
    setLinkOpen(false);
    setLinkUrl("");
  }

  function emitChange() {
    const html = editorRef.current?.innerHTML ?? "";
    setEmpty(editorLooksEmpty(html));
    onChange?.(html);
  }

  function exec(cmd: string, value?: string) {
    const editor = editorRef.current;
    if (!editor) return;
    execEditorCommand(editor, cmd, value, savedRangeRef.current);
    cacheSelection();
    emitChange();
  }

  function closeMenus() {
    setColorOpen(false);
    setSizeOpen(false);
    setSpacingOpen(false);
  }

  function applyColor(kind: "foreColor" | "hiliteColor", color: string) {
    exec("styleWithCSS", "true");
    exec(kind, color);
    closeMenus();
  }

  function applySize(px: string) {
    const editor = editorRef.current;
    if (!editor) return;
    applyInlineStyle(
      editor,
      { fontSize: px },
      savedRangeRef.current,
    );
    cacheSelection();
    emitChange();
    closeMenus();
  }

  function applySpacing(value: "compact" | "normal" | "relaxed") {
    const editor = editorRef.current;
    if (!editor) return;
    applyParagraphSpacing(editor, value, savedRangeRef.current);
    cacheSelection();
    emitChange();
    closeMenus();
  }

  function applyLink() {
    const editor = editorRef.current;
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) return;
    const existing = inspectedLinkRef.current;
    if (existing && editor.contains(existing)) {
      updateAnchorHref(existing, trimmed);
    } else {
      applyHrefToLinkMark(editor, trimmed, savedRangeRef.current);
    }
    hideLinkChip();
    emitChange();
    setLinkUrl("");
    setLinkOpen(false);
  }

  return (
    <div className="rounded-lg border border-gray-300 bg-white">
      <div
        className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 px-2 py-1.5"
        onMouseDown={toolbarMouseDown}
      >
        <ToolbarMenu
          label="Size"
          open={sizeOpen}
          onToggle={() => {
            setSizeOpen((open) => !open);
            setSpacingOpen(false);
            setColorOpen(false);
            setLinkOpen(false);
          }}
          options={[
            { value: "13px", label: "Small" },
            { value: "16px", label: "Normal" },
            { value: "20px", label: "Large" },
            { value: "26px", label: "Huge" },
          ]}
          onPick={applySize}
        />
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
        <div className="relative">
          <ToolButton
            title="Text and background color"
            onClick={() => {
              setColorOpen((open) => !open);
              setSizeOpen(false);
              setSpacingOpen(false);
              setLinkOpen(false);
            }}
            className={colorOpen ? "bg-white" : ""}
          >
            <span className="border-b-2 border-gray-800 font-semibold">A</span>
          </ToolButton>
          {colorOpen ? (
            <div
              className="absolute bottom-full left-0 z-20 mb-1 rounded-lg border border-gray-200 bg-white p-3 shadow-lg"
              onMouseDown={toolbarMouseDown}
            >
              <div className="flex gap-6">
                <ColorGrid
                  label="Background color"
                  onPick={(color) => applyColor("hiliteColor", color)}
                />
                <ColorGrid
                  label="Text color"
                  onPick={(color) => applyColor("foreColor", color)}
                />
              </div>
            </div>
          ) : null}
        </div>
        <span className="mx-0.5 text-gray-300">|</span>
        <ToolButton title="Align left" onClick={() => exec("justifyLeft")}>
          Left
        </ToolButton>
        <ToolButton title="Align center" onClick={() => exec("justifyCenter")}>
          Center
        </ToolButton>
        <ToolButton title="Align right" onClick={() => exec("justifyRight")}>
          Right
        </ToolButton>
        <ToolbarMenu
          label="Spacing"
          open={spacingOpen}
          onToggle={() => {
            setSpacingOpen((open) => !open);
            setSizeOpen(false);
            setColorOpen(false);
            setLinkOpen(false);
          }}
          options={[
            { value: "compact", label: "Tight" },
            { value: "normal", label: "Normal" },
            { value: "relaxed", label: "Loose" },
          ]}
          onPick={(value) =>
            applySpacing(value as "compact" | "normal" | "relaxed")
          }
        />
        <span className="mx-0.5 text-gray-300">|</span>
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
        <ToolButton title="Indent" onClick={() => exec("indent")}>
          Indent
        </ToolButton>
        <ToolButton
          title="Insert link"
          onClick={() => {
            if (linkOpen) closeLinkBox();
            else openLinkBox();
          }}
          className={linkOpen ? "bg-white font-medium text-blue-600" : ""}
        >
          Link
        </ToolButton>
        {extraToolbar}
      </div>
      {linkOpen ? (
        <div
          className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2"
          onMouseDown={(e) => {
            if (e.target instanceof HTMLInputElement) return;
            e.preventDefault();
          }}
        >
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") closeLinkBox();
            }}
            placeholder="https://thebeanbook.com"
            className="min-w-[12rem] flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded bg-gray-900 px-3 py-1 text-sm text-white hover:bg-gray-800"
          >
            Add link
          </button>
          <button
            type="button"
            onClick={closeLinkBox}
            className="text-sm text-gray-600 hover:underline"
          >
            Cancel
          </button>
        </div>
      ) : null}
      <div className="relative min-h-[320px] bg-white" ref={wrapRef}>
        {empty ? (
          <p
            className="pointer-events-none absolute left-4 top-4 z-0 text-base text-gray-400"
            aria-hidden
          >
            {placeholder}
          </p>
        ) : null}
        <div
          ref={editorRef}
          contentEditable
          role="textbox"
          aria-label="Email message"
          aria-multiline="true"
          onMouseUp={cacheSelection}
          onKeyUp={cacheSelection}
          onInput={emitChange}
          onClick={onEditorClick}
          className={`relative z-10 block w-full ${minHeightClass} cursor-text px-4 py-4 text-base leading-relaxed outline-none [&_a]:text-[#1a73e8] [&_a]:underline [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-7 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-7 [&_li]:my-1 [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold`}
          style={{ color: colors.text.body, minHeight: 320 }}
          suppressContentEditableWarning
        />
        {linkChip ? (
          <div
            className="absolute z-30 max-w-[min(100%,24rem)] rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-md"
            style={{ top: linkChip.top, left: linkChip.left }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-gray-800">Go to link:</span>
              <a
                href={linkChip.href}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-[#1a73e8] hover:underline"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {linkChip.href}
              </a>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={startChangeLink}
                className="text-[#1a73e8] hover:underline"
              >
                Change
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={removeInspectedLink}
                className="text-[#1a73e8] hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}