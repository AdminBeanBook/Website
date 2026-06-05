import { getPageTextSlots, type PageTextSlot } from "@/lib/pages/text-slots";
import type { SiteTextColors } from "@/lib/site-config/types";

export type PageTextColorOverrides = Record<string, string>;

export function parsePageTextColors(json: string | null | undefined): PageTextColorOverrides {
  if (!json?.trim()) return {};
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const out: PageTextColorOverrides = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.trim()) out[key] = value.trim();
    }
    return out;
  } catch {
    return {};
  }
}

export function serializePageTextColors(overrides: PageTextColorOverrides): string {
  const cleaned: PageTextColorOverrides = {};
  for (const [key, value] of Object.entries(overrides)) {
    if (value?.trim()) cleaned[key] = value.trim();
  }
  return JSON.stringify(cleaned);
}

export function resolvePageTextColor(
  slotId: string,
  template: string,
  overrides: PageTextColorOverrides,
  siteText: SiteTextColors,
): string {
  const override = overrides[slotId]?.trim();
  if (override) return override;

  const slot = getPageTextSlots(template).find((s) => s.id === slotId);
  if (slot?.defaultHex) return slot.defaultHex;
  if (slot) return siteText[slot.defaultRole];
  return siteText.body;
}

export function resolvePageTextColors(
  template: string,
  overrides: PageTextColorOverrides,
  siteText: SiteTextColors,
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const slot of getPageTextSlots(template)) {
    resolved[slot.id] = resolvePageTextColor(
      slot.id,
      template,
      overrides,
      siteText,
    );
  }
  return resolved;
}

export function pageTextColorsEqual(
  a: PageTextColorOverrides,
  b: PageTextColorOverrides,
  template: string,
): boolean {
  const slots = getPageTextSlots(template);
  for (const { id } of slots) {
    if ((a[id] ?? "") !== (b[id] ?? "")) return false;
  }
  return true;
}

export type PageTextColorsContext = {
  template: string;
  overrides: PageTextColorOverrides;
  siteText: SiteTextColors;
  resolved: Record<string, string>;
};

export function buildPageTextColorsContext(
  template: string,
  overrides: PageTextColorOverrides,
  siteText: SiteTextColors,
): PageTextColorsContext {
  return {
    template,
    overrides,
    siteText,
    resolved: resolvePageTextColors(template, overrides, siteText),
  };
}

export function colorStyle(slotId: string, ctx: PageTextColorsContext) {
  return { color: ctx.resolved[slotId] };
}

export function slotUsesContentField(slot: PageTextSlot): boolean {
  return slot.id === "heroTitle" || slot.id === "heroSubtitle" || slot.id === "body";
}
