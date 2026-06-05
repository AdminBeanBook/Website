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

  if (range.collapsed) {
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.textContent = href;
    range.insertNode(anchor);
    const after = document.createRange();
    after.setStartAfter(anchor);
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
    return true;
  }

  const anchor = document.createElement("a");
  anchor.href = href;
  try {
    range.surroundContents(anchor);
  } catch {
    const fragment = range.extractContents();
    anchor.appendChild(fragment);
    range.insertNode(anchor);
  }

  sel.removeAllRanges();
  const end = document.createRange();
  end.selectNodeContents(anchor);
  end.collapse(false);
  sel.addRange(end);
  return true;
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
