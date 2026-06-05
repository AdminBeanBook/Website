import { prisma } from "@/lib/db";
import {
  DEFAULT_SITE_CONFIG,
  SITE_SETTINGS_ID,
} from "@/lib/site-config/defaults";
import { migrateSiteConfigButtons } from "@/lib/site-config/free-buttons";
import { normalizeSiteTextColors } from "@/lib/site-config/text-colors";
import type { SiteConfig } from "@/lib/site-config/types";

export type SiteConfigVariant = "published" | "draft";

export { DEFAULT_SITE_CONFIG, SITE_SETTINGS_ID };
export type { SiteConfig, SiteButtonConfig, NavLinkConfig, BrandColors } from "@/lib/site-config/types";
export { BUTTON_PLACEMENTS } from "@/lib/site-config/types";

function parseConfig(json: string | null | undefined): SiteConfig | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as SiteConfig;
  } catch {
    return null;
  }
}

function mergeWithDefaults(partial: SiteConfig | null): SiteConfig {
  if (!partial) return DEFAULT_SITE_CONFIG;
  const colors = {
    ...DEFAULT_SITE_CONFIG.colors,
    ...partial.colors,
    text: normalizeSiteTextColors(
      partial.colors?.text,
      partial.colors?.accent ?? DEFAULT_SITE_CONFIG.colors.accent,
    ),
  };
  const merged: SiteConfig = {
    site: { ...DEFAULT_SITE_CONFIG.site, ...partial.site },
    colors,
    images: {
      ...DEFAULT_SITE_CONFIG.images,
      ...partial.images,
      gallery: partial.images?.gallery?.length
        ? partial.images.gallery
        : DEFAULT_SITE_CONFIG.images.gallery,
    },
    nav: partial.nav?.length ? partial.nav : DEFAULT_SITE_CONFIG.nav,
    buttons: partial.buttons?.length
      ? partial.buttons
      : DEFAULT_SITE_CONFIG.buttons,
  };
  return migrateSiteConfigButtons(merged);
}

export function siteConfigHasUnpublishedChanges(
  published: SiteConfig,
  draft: SiteConfig,
): boolean {
  return JSON.stringify(published) !== JSON.stringify(draft);
}

export async function ensureSiteSettings() {
  const existing = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });
  if (existing) return existing;

  const json = JSON.stringify(DEFAULT_SITE_CONFIG);
  return prisma.siteSettings.create({
    data: {
      id: SITE_SETTINGS_ID,
      publishedConfig: json,
      draftConfig: json,
      publishedAt: new Date(),
      draftUpdatedAt: new Date(),
    },
  });
}

export async function getSiteConfig(
  variant: SiteConfigVariant = "published",
): Promise<SiteConfig> {
  await ensureSiteSettings();
  const row = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
  });
  if (!row) return DEFAULT_SITE_CONFIG;

  const published = mergeWithDefaults(parseConfig(row.publishedConfig));
  if (variant === "published") return published;

  return mergeWithDefaults(parseConfig(row.draftConfig) ?? published);
}

export async function saveSiteConfigDraft(config: SiteConfig) {
  await ensureSiteSettings();
  return prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: {
      draftConfig: JSON.stringify(config),
      draftUpdatedAt: new Date(),
    },
  });
}

export async function publishSiteConfig() {
  const row = await ensureSiteSettings();
  const draft = mergeWithDefaults(parseConfig(row.draftConfig));
  const now = new Date();
  const json = JSON.stringify(draft);

  return prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: {
      publishedConfig: json,
      draftConfig: json,
      publishedAt: now,
      draftUpdatedAt: now,
    },
  });
}

export async function discardSiteConfigDraft() {
  const row = await ensureSiteSettings();
  const published = mergeWithDefaults(parseConfig(row.publishedConfig));
  return prisma.siteSettings.update({
    where: { id: SITE_SETTINGS_ID },
    data: {
      draftConfig: JSON.stringify(published),
      draftUpdatedAt: new Date(),
    },
  });
}

export function getEnabledNavLinks(config: SiteConfig) {
  return config.nav.filter((link) => link.enabled);
}

export function getButtonsForPlacement(
  config: SiteConfig,
  placement: string,
  pageSlug?: string,
) {
  return config.buttons.filter((b) => {
    if (!b.enabled || !b.placement.includes(placement)) return false;
    if (pageSlug && b.pagePositions?.[pageSlug]) return false;
    return true;
  });
}

export {
  pathnameToPageSlug,
  getButtonPagePosition,
  getFreeButtonsForPage,
  getSlotButtonsForPlacement,
  migrateSiteConfigButtons,
  applyConfigButtonPosition,
  applyConfigNewButtonAt,
  clampPercent,
  PAGE_CANVAS_ID,
} from "@/lib/site-config/free-buttons";
export type { PageButtonPosition } from "@/lib/site-config/free-buttons";
