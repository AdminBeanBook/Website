import { getPageLivePath } from "@/lib/pages/paths";
import type { NavLinkConfig, SiteImages } from "@/lib/site-config/types";

export type EditorCustomizeTab =
  | "shops"
  | "text"
  | "colors"
  | "photos"
  | "buttons"
  | "navigation";

const STANDARD_CUSTOMIZE_TABS: { id: EditorCustomizeTab; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "colors", label: "Colors" },
  { id: "photos", label: "Photos" },
  { id: "buttons", label: "Buttons" },
  { id: "navigation", label: "Navigation" },
];

/** Customize tabs shown in the website editor left rail for the current page. */
export function getCustomizeTabs(pageSlug: string): { id: EditorCustomizeTab; label: string }[] {
  if (pageSlug === "map") {
    return [
      { id: "shops", label: "Coffee shops" },
      { id: "text", label: "Hero text" },
      ...STANDARD_CUSTOMIZE_TABS.filter((t) => t.id !== "text"),
    ];
  }
  return STANDARD_CUSTOMIZE_TABS;
}

export function defaultCustomizeTab(pageSlug: string): EditorCustomizeTab {
  return pageSlug === "map" ? "shops" : "text";
}

export type PageEditorInput = {
  slug: string;
  path: string | null;
  template: string;
};

export type PageImageField = {
  key: keyof SiteImages;
  label: string;
  /** Gallery is edited as a list on one page */
  isGallery?: boolean;
};

const HEADER_PLACEMENT = "header";

/** Button placements that render on this page template (includes shared header). */
export function getPageButtonPlacements(template: string): string[] {
  const placements = [HEADER_PLACEMENT];
  if (template === "home") {
    placements.push("home-hero", "home-content");
  }
  if (template === "purchase") {
    placements.push("purchase");
  }
  return placements;
}

export function buttonAppliesToPage(
  button: { placement: string[]; pagePositions?: Record<string, { x: number; y: number }> },
  pageSlug: string,
  template: string,
): boolean {
  if (button.pagePositions?.[pageSlug]) return true;
  const allowed = getPageButtonPlacements(template);
  return button.placement.some((p) => allowed.includes(p));
}

export function getPageImageFields(template: string): PageImageField[] {
  const fields: PageImageField[] = [
    { key: "logo", label: "Header logo (shown on every page)" },
  ];
  if (template === "home") {
    fields.push(
      { key: "heroMug", label: "Home hero background" },
      { key: "gallery", label: "Home photo gallery", isGallery: true },
    );
  }
  if (template === "purchase") {
    fields.push({ key: "productCover", label: "Product cover image" });
  }
  return fields;
}

function normalizeHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.replace(/\/$/, "");
}

export function getPageLiveHref(page: PageEditorInput): string {
  return normalizeHref(
    getPageLivePath({
      slug: page.slug,
      path: page.path,
      template: page.template,
    }),
  );
}

/** Nav entries that point at this page’s live URL. */
export function getNavEntriesForPage(
  nav: NavLinkConfig[],
  page: PageEditorInput,
): { link: NavLinkConfig; index: number }[] {
  const live = getPageLiveHref(page);
  return nav
    .map((link, index) => ({ link, index }))
    .filter(({ link }) => normalizeHref(link.href) === live);
}

export function getPageEditorLabel(page: PageEditorInput): string {
  if (page.slug === "home") return "Home";
  if (page.slug === "map") return "Map & Coffee Shops";
  return page.slug;
}
