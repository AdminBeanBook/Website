/** Convert #rrggbb to "r g b" channels for Tailwind opacity modifiers. */
export function hexToRgbChannels(hex: string): string {
  const normalized = hex.trim().replace(/^#/, "");
  if (normalized.length !== 6) {
    return "30 58 58";
  }
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return "30 58 58";
  }
  return `${r} ${g} ${b}`;
}
