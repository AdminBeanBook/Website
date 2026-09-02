export function normalizeLinkUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getSelectionRangeIn(
  container: HTMLElement,
): Range | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!container.contains(range.commonAncestorContainer)) return null;
  return range.cloneRange();
}

export function restoreSelectionRange(range: Range | null): void {
  if (!range) return;
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

const LINK_MARK = "data-link-mark";

function styleAsLink(anchor: HTMLAnchorElement, href: string): void {
  anchor.href = href;
  anchor.setAttribute("target", "_blank");
  anchor.style.color = "#1a73e8";
  anchor.style.textDecoration = "underline";
}

export function unwrapLinkMarks(editor: HTMLElement): void {
  for (const mark of [...editor.querySelectorAll(`[${LINK_MARK}]`)]) {
    mark.replaceWith(...mark.childNodes);
  }
}

export function markLinkSelection(
  editor: HTMLElement,
  savedRange?: Range | null,
): boolean {
  unwrapLinkMarks(editor);
  editor.focus();
  if (savedRange) restoreSelectionRange(savedRange);

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer) || range.collapsed) {
    return false;
  }

  const mark = document.createElement("span");
  mark.setAttribute(LINK_MARK, "true");
  mark.style.backgroundColor = "#d3e3fd";
  try {
    range.surroundContents(mark);
  } catch {
    mark.appendChild(range.extractContents());
    range.insertNode(mark);
  }
  return true;
}

export function applyHrefToLinkMark(
  editor: HTMLElement,
  url: string,
  savedRange?: Range | null,
): boolean {
  const href = normalizeLinkUrl(url);
  if (!href) return false;

  const mark = editor.querySelector(`[${LINK_MARK}]`);
  if (mark) {
    const anchor = document.createElement("a");
    styleAsLink(anchor, href);
    while (mark.firstChild) anchor.appendChild(mark.firstChild);
    mark.replaceWith(anchor);
    for (const nested of [...anchor.querySelectorAll("a")]) {
      if (nested !== anchor) nested.replaceWith(...nested.childNodes);
    }
    return true;
  }

  return insertLinkInEditor(editor, url, savedRange);
}

export function closestAnchor(
  node: EventTarget | null,
  editor: HTMLElement,
): HTMLAnchorElement | null {
  if (!(node instanceof Node)) return null;
  const el = node instanceof Element ? node : node.parentElement;
  const a = el?.closest("a");
  if (a instanceof HTMLAnchorElement && editor.contains(a)) return a;
  return null;
}

export function updateAnchorHref(
  anchor: HTMLAnchorElement,
  url: string,
): boolean {
  const href = normalizeLinkUrl(url);
  if (!href) return false;
  styleAsLink(anchor, href);
  return true;
}

export function removeAnchorKeepText(anchor: HTMLAnchorElement): void {
  anchor.replaceWith(...anchor.childNodes);
}

export function insertLinkInEditor(
  editor: HTMLElement,
  url: string,
  savedRange?: Range | null,
): boolean {
  const href = normalizeLinkUrl(url);
  if (!href) return false;

  editor.focus();
  if (savedRange) restoreSelectionRange(savedRange);

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return false;

  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return false;

  const anchor = document.createElement("a");
  styleAsLink(anchor, href);

  if (range.collapsed) {
    anchor.textContent = href;
    range.insertNode(anchor);
    const after = document.createRange();
    after.setStartAfter(anchor);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    return true;
  }

  try {
    range.surroundContents(anchor);
  } catch {
    const fragment = range.extractContents();
    anchor.appendChild(fragment);
    range.insertNode(anchor);
  }

  for (const nested of [...anchor.querySelectorAll("a")]) {
    nested.replaceWith(...nested.childNodes);
  }

  sel.removeAllRanges();
  const end = document.createRange();
  end.selectNodeContents(anchor);
  end.collapse(false);
  sel.addRange(end);
  return true;
}

export function applyInlineStyle(
  editor: HTMLElement,
  styles: Partial<CSSStyleDeclaration>,
  savedRange?: Range | null,
): void {
  editor.focus();
  if (savedRange) restoreSelectionRange(savedRange);
  document.execCommand("styleWithCSS", false, "true");

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const span = document.createElement("span");
  Object.assign(span.style, styles);

  if (range.collapsed) {
    span.appendChild(document.createTextNode("\u200b"));
    range.insertNode(span);
    const inside = document.createRange();
    inside.selectNodeContents(span);
    inside.collapse(false);
    sel.removeAllRanges();
    sel.addRange(inside);
    return;
  }

  try {
    range.surroundContents(span);
  } catch {
    span.appendChild(range.extractContents());
    range.insertNode(span);
  }
}

function closestBlock(node: Node, editor: HTMLElement): HTMLElement | null {
  let current: Node | null = node;
  while (current && current !== editor) {
    if (current instanceof HTMLElement) {
      const tag = current.tagName;
      if (
        ["P", "DIV", "LI", "H1", "H2", "H3", "H4", "BLOCKQUOTE"].includes(tag)
      ) {
        return current;
      }
    }
    current = current.parentNode;
  }
  return null;
}

export function applyParagraphSpacing(
  editor: HTMLElement,
  spacing: "compact" | "normal" | "relaxed",
  savedRange?: Range | null,
): void {
  const styles = {
    compact: { lineHeight: "1.3", margin: "0 0 6px" },
    normal: { lineHeight: "1.6", margin: "0 0 16px" },
    relaxed: { lineHeight: "1.9", margin: "0 0 28px" },
  }[spacing];

  editor.focus();
  if (savedRange) restoreSelectionRange(savedRange);

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (!editor.contains(range.commonAncestorContainer)) return;

  const blocks = new Set<HTMLElement>();
  if (range.collapsed) {
    const block = closestBlock(range.startContainer, editor);
    if (block) blocks.add(block);
  } else {
    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_ELEMENT,
    );
    let node: Node | null = walker.currentNode;
    while (node) {
      if (range.intersectsNode(node)) {
        const block = closestBlock(node, editor);
        if (block) blocks.add(block);
      }
      node = walker.nextNode();
    }
    const startBlock = closestBlock(range.startContainer, editor);
    if (startBlock) blocks.add(startBlock);
  }

  if (blocks.size === 0) {
    const block = editor.querySelector("p") ?? editor;
    if (block instanceof HTMLElement) blocks.add(block);
  }

  for (const block of blocks) {
    block.style.lineHeight = styles.lineHeight;
    block.style.margin = styles.margin;
  }
}

export function execEditorCommand(
  editor: HTMLElement,
  command: string,
  value?: string,
  savedRange?: Range | null,
): void {
  editor.focus();
  if (savedRange) restoreSelectionRange(savedRange);
  document.execCommand(command, false, value);
  editor.focus();
}
