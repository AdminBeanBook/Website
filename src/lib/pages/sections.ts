import { parseHomeBody } from "@/lib/pages/home-body";
import {
  parseLearnMoreTeam,
  serializeLearnMoreTeam,
  type LearnMoreTeamMember,
} from "@/lib/pages/learn-more-team";
import type { SiteButtonConfig, SiteConfig } from "@/lib/site-config/types";
import { getButtonPagePosition } from "@/lib/site-config/free-buttons";

export const PAGE_SECTION_TYPES = [
  "hero",
  "rich-text",
  "gallery",
  "cta",
  "product",
  "contact-form",
  "shop-directory",
  "team",
  "about",
] as const;

export type PageSectionType = (typeof PAGE_SECTION_TYPES)[number];

export type SectionButton = {
  id: string;
  label: string;
  href: string;
  style: "primary" | "outline";
  action: "link" | "checkout";
};

export const SECTION_BLOCK_TYPES = ["heading", "text", "button"] as const;
export type SectionBlockType = (typeof SECTION_BLOCK_TYPES)[number];

export type SectionBlock = {
  id: string;
  type: SectionBlockType;
  settings: Record<string, unknown>;
};

const BLOCK_SECTIONS = new Set<PageSectionType>(["hero", "rich-text", "cta"]);

export type PageSection = {
  id: string;
  type: PageSectionType;
  enabled: boolean;
  settings: Record<string, unknown>;
};

export type FlattenedPageFields = {
  title: string;
  subtitle: string | null;
  body: string;
  heroImage?: string;
  productImage?: string;
  gallery?: string[];
};

const ADDABLE_TYPES: PageSectionType[] = ["hero", "rich-text", "gallery", "cta"];

const UNIQUE_TYPES = new Set<PageSectionType>([
  "product",
  "contact-form",
  "shop-directory",
  "team",
  "about",
]);

export const SECTION_META: Record<
  PageSectionType,
  { label: string; addable: boolean }
> = {
  hero: { label: "Hero", addable: true },
  "rich-text": { label: "Rich text", addable: true },
  gallery: { label: "Image gallery", addable: true },
  cta: { label: "Buttons", addable: true },
  product: { label: "Product", addable: false },
  "contact-form": { label: "Contact form", addable: false },
  "shop-directory": { label: "Coffee shops", addable: false },
  team: { label: "Team", addable: false },
  about: { label: "About story", addable: false },
};

export function isPageSectionType(value: string): value is PageSectionType {
  return (PAGE_SECTION_TYPES as readonly string[]).includes(value);
}

export function sectionLabel(type: PageSectionType): string {
  return SECTION_META[type].label;
}

export function newSectionId(type: string): string {
  return `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newBlockId(type: SectionBlockType): string {
  return newSectionId(type);
}

export function createBlock(
  type: SectionBlockType,
  settings: Record<string, unknown> = {},
): SectionBlock {
  if (type === "heading") {
    return { id: newBlockId("heading"), type, settings: { text: "", ...settings } };
  }
  if (type === "text") {
    return { id: newBlockId("text"), type, settings: { text: "", ...settings } };
  }
  return {
    id: newBlockId("button"),
    type: "button",
    settings: {
      label: "New button",
      href: "/purchase",
      style: "primary",
      action: "link",
      ...settings,
    },
  };
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseButtonBlock(block: SectionBlock): SectionButton {
  return {
    id: block.id,
    label: asString(block.settings.label, "Button"),
    href: asString(block.settings.href, "/"),
    style: block.settings.style === "outline" ? "outline" : "primary",
    action: block.settings.action === "checkout" ? "checkout" : "link",
  };
}

export function parseSectionBlocks(raw: unknown): SectionBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is SectionBlock => {
      if (!item || typeof item !== "object") return false;
      const row = item as SectionBlock;
      return (
        typeof row.id === "string" &&
        (SECTION_BLOCK_TYPES as readonly string[]).includes(row.type)
      );
    })
    .map((row) => ({
      id: row.id,
      type: row.type,
      settings: row.settings && typeof row.settings === "object" ? row.settings : {},
    }));
}

function legacyButtonsToBlocks(raw: unknown): SectionBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is SectionButton => {
      if (!item || typeof item !== "object") return false;
      return typeof (item as SectionButton).id === "string";
    })
    .map((btn) => ({
      id: btn.id,
      type: "button" as const,
      settings: {
        label: btn.label,
        href: btn.href ?? "/",
        style: btn.style === "outline" ? "outline" : "primary",
        action: btn.action === "checkout" ? "checkout" : "link",
      },
    }));
}

export function blocksFromLegacySettings(
  type: PageSectionType,
  settings: Record<string, unknown>,
): SectionBlock[] {
  const blocks: SectionBlock[] = [];
  const pushText = (blockType: "heading" | "text", value: unknown) => {
    const text = asString(value);
    if (!text) return;
    blocks.push({
      id: newBlockId(blockType),
      type: blockType,
      settings: { text },
    });
  };

  if (type === "hero") {
    pushText("heading", settings.title);
    pushText("text", settings.subtitle);
  } else if (type === "rich-text") {
    pushText("heading", settings.heading);
    pushText("text", settings.description);
    pushText("text", settings.paragraph);
    const body = asString(settings.body);
    for (const part of body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)) {
      pushText("text", part);
    }
  }
  blocks.push(...legacyButtonsToBlocks(settings.buttons));
  return blocks;
}

export function getSectionBlocks(section: PageSection): SectionBlock[] {
  const stored = parseSectionBlocks(section.settings.blocks);
  if (stored.length > 0) return stored;
  if (!BLOCK_SECTIONS.has(section.type)) return [];
  return blocksFromLegacySettings(section.type, section.settings);
}

export function setSectionBlocks(
  section: PageSection,
  blocks: SectionBlock[],
): PageSection {
  const heading = blocks.find((b) => b.type === "heading");
  const texts = blocks.filter((b) => b.type === "text");
  const buttons = blocks
    .filter((b) => b.type === "button")
    .map(parseButtonBlock);
  const headingText = heading ? asString(heading.settings.text) : "";
  const textValues = texts.map((b) => asString(b.settings.text));

  return {
    ...section,
    settings: {
      ...section.settings,
      blocks,
      title: headingText,
      heading: headingText,
      subtitle: section.type === "hero" ? (textValues[0] ?? "") : section.settings.subtitle,
      description: textValues[0] ?? "",
      paragraph: textValues[1] ?? "",
      body: textValues.slice(section.type === "hero" ? 1 : 2).join("\n\n"),
      buttons,
    },
  };
}

export function moveBlock(
  blocks: SectionBlock[],
  fromIndex: number,
  toIndex: number,
): SectionBlock[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= blocks.length ||
    toIndex >= blocks.length
  ) {
    return blocks;
  }
  const next = [...blocks];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function defaultSectionSettings(
  type: PageSectionType,
): Record<string, unknown> {
  switch (type) {
    case "hero":
      return {
        backgroundImage: "",
        ...setSectionBlocks(
          { id: "tmp", type: "hero", enabled: true, settings: {} },
          [createBlock("heading", { text: "New heading" })],
        ).settings,
      };
    case "rich-text":
      return setSectionBlocks(
        { id: "tmp", type: "rich-text", enabled: true, settings: {} },
        [createBlock("heading"), createBlock("text")],
      ).settings;
    case "gallery":
      return { images: [""] };
    case "cta":
      return setSectionBlocks(
        { id: "tmp", type: "cta", enabled: true, settings: {} },
        [],
      ).settings;
    case "product":
      return {
        title: "Bean Book: 2026 Edition",
        priceLabel: "$25.00 USD",
        finePrint: "Secure checkout powered by Stripe. US shipping address required.",
        image: "",
      };
    case "contact-form":
      return {};
    case "shop-directory":
      return { heading: "2026 Map", subtext: "Denver Metro Shops" };
    case "team":
      return { members: [] };
    case "about":
      return {};
  }
}

export function createSection(type: PageSectionType): PageSection {
  return {
    id: newSectionId(type),
    type,
    enabled: true,
    settings: defaultSectionSettings(type),
  };
}

export function addableSectionTypes(
  existing: PageSection[],
): PageSectionType[] {
  const present = new Set(existing.map((s) => s.type));
  return ADDABLE_TYPES.filter((type) => {
    if (UNIQUE_TYPES.has(type) && present.has(type)) return false;
    return true;
  });
}

export function parsePageSections(raw: string | null | undefined): PageSection[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is PageSection => {
        if (!item || typeof item !== "object") return false;
        const row = item as PageSection;
        return (
          typeof row.id === "string" &&
          isPageSectionType(row.type) &&
          typeof row.settings === "object" &&
          row.settings !== null
        );
      })
      .map((row) => ({
        id: row.id,
        type: row.type,
        enabled: row.enabled !== false,
        settings: row.settings ?? {},
      }));
  } catch {
    return [];
  }
}

export function serializePageSections(sections: PageSection[]): string {
  return JSON.stringify(sections);
}

export function pageSectionsEqual(a: PageSection[], b: PageSection[]): boolean {
  return serializePageSections(a) === serializePageSections(b);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? ""));
}

export function getSectionButtons(section: PageSection): SectionButton[] {
  return getSectionBlocks(section)
    .filter((block) => block.type === "button")
    .map(parseButtonBlock);
}

export function sectionButtonsToSiteButtons(
  buttons: SectionButton[],
): SiteButtonConfig[] {
  return buttons.map((btn) => ({
    ...btn,
    placement: [],
    enabled: true,
  }));
}

function buttonToBlock(btn: SectionButton): SectionBlock {
  return {
    id: btn.id,
    type: "button",
    settings: {
      label: btn.label,
      href: btn.href,
      style: btn.style,
      action: btn.action,
    },
  };
}

function pageButtonSlot(
  btn: SiteButtonConfig,
  pageSlug: string,
): "hero" | "content" | null {
  if (btn.placement.includes("header") && !btn.pagePositions?.[pageSlug]) {
    return null;
  }
  if (pageSlug === "home") {
    if (btn.id === "btn-home-learn" || btn.placement.includes("home-content")) {
      return "content";
    }
    if (btn.id === "btn-home-hero" || btn.placement.includes("home-hero")) {
      return "hero";
    }
  }
  const pos = getButtonPagePosition(btn, pageSlug);
  if (!pos) return null;
  if (pageSlug === "home" && pos.y > 67) return "content";
  return "hero";
}

function buttonsFromSiteConfig(
  config: SiteConfig,
  pageSlug: string,
  slot: "hero" | "content",
): SectionButton[] {
  return config.buttons
    .filter((btn) => {
      if (!btn.enabled) return false;
      return pageButtonSlot(btn, pageSlug) === slot;
    })
    .map((btn) => ({
      id: btn.id,
      label: btn.label,
      href: btn.href,
      style: btn.style,
      action: btn.action,
    }));
}

export type SectionSourcePage = {
  slug: string;
  template: string;
  title: string;
  subtitle: string | null;
  body: string;
};

export function hydratePageSections(
  page: SectionSourcePage,
  config: SiteConfig,
): PageSection[] {
  const { slug, template, title, subtitle, body } = page;

  if (template === "home") {
    const home = parseHomeBody(body);
    const heroButtons = buttonsFromSiteConfig(config, slug, "hero");
    const storyButtons = buttonsFromSiteConfig(config, slug, "content");
    return [
      setSectionBlocks(
        {
          id: "home-hero",
          type: "hero",
          enabled: true,
          settings: { backgroundImage: config.images.heroMug },
        },
        [
          createBlock("heading", { text: title }),
          ...heroButtons.map(buttonToBlock),
        ],
      ),
      setSectionBlocks(
        {
          id: "home-story",
          type: "rich-text",
          enabled: true,
          settings: {},
        },
        [
          createBlock("heading", { text: subtitle ?? "The Bean Book" }),
          ...(home.description
            ? [createBlock("text", { text: home.description })]
            : []),
          ...(home.paragraph
            ? [createBlock("text", { text: home.paragraph })]
            : []),
          ...storyButtons.map(buttonToBlock),
        ],
      ),
      {
        id: "home-gallery",
        type: "gallery",
        enabled: true,
        settings: { images: [...config.images.gallery] },
      },
    ];
  }

  if (template === "purchase") {
    return [
      {
        id: "purchase-hero",
        type: "hero",
        enabled: true,
        settings: {
          title,
          subtitle: subtitle ?? "",
          backgroundImage: "",
          buttons: [],
        },
      },
      {
        id: "purchase-product",
        type: "product",
        enabled: true,
        settings: {
          title: "Bean Book: 2026 Edition",
          priceLabel: "$25.00 USD",
          finePrint:
            "Secure checkout powered by Stripe. US shipping address required.",
          image: config.images.productCover,
        },
      },
    ];
  }

  if (template === "contact") {
    return [
      {
        id: "contact-hero",
        type: "hero",
        enabled: true,
        settings: {
          title,
          subtitle: "",
          backgroundImage: "",
          buttons: [],
        },
      },
      {
        id: "contact-form",
        type: "contact-form",
        enabled: true,
        settings: {},
      },
    ];
  }

  if (template === "map") {
    return [
      {
        id: "map-hero",
        type: "hero",
        enabled: true,
        settings: {
          title,
          subtitle: subtitle ?? "",
          backgroundImage: "",
          buttons: [],
        },
      },
      {
        id: "map-directory",
        type: "shop-directory",
        enabled: true,
        settings: {
          heading: "2026 Map",
          subtext: "Denver Metro Shops",
        },
      },
    ];
  }

  if (template === "learn-more") {
    return [
      {
        id: "learn-hero",
        type: "hero",
        enabled: true,
        settings: {
          title,
          subtitle: subtitle ?? "",
          backgroundImage: "",
          buttons: [],
        },
      },
      {
        id: "learn-team",
        type: "team",
        enabled: true,
        settings: { members: parseLearnMoreTeam(body).members },
      },
    ];
  }

  if (template === "so-what-is-it") {
    return [
      {
        id: "about-hero",
        type: "hero",
        enabled: true,
        settings: {
          title,
          subtitle: subtitle ?? "",
          backgroundImage: "",
          buttons: [],
        },
      },
      {
        id: "about-story",
        type: "about",
        enabled: true,
        settings: {},
      },
      setSectionBlocks(
        {
          id: "about-cta",
          type: "cta",
          enabled: true,
          settings: {},
        },
        [
          createBlock("button", {
            label: "Buy Now",
            href: "/purchase",
            style: "primary",
            action: "link",
          }),
        ],
      ),
    ];
  }

  return [
    {
      id: `${slug}-hero`,
      type: "hero",
      enabled: true,
      settings: {
        title,
        subtitle: subtitle ?? "",
        backgroundImage: "",
        buttons: [],
      },
    },
    {
      id: `${slug}-body`,
      type: "rich-text",
      enabled: true,
      settings: {
        heading: "",
        description: "",
        paragraph: "",
        body,
        buttons: [],
      },
    },
  ];
}

export function normalizePageSections(sections: PageSection[]): PageSection[] {
  const seenButtonIds = new Set<string>();
  return sections.map((section) => {
    if (!BLOCK_SECTIONS.has(section.type)) return section;
    const blocks = getSectionBlocks(section).filter((block) => {
      if (block.type !== "button") return true;
      if (seenButtonIds.has(block.id)) return false;
      seenButtonIds.add(block.id);
      return true;
    });
    return setSectionBlocks(section, blocks);
  });
}

export function resolvePageSections(
  page: SectionSourcePage & { storedSections?: PageSection[] },
  config: SiteConfig,
): PageSection[] {
  const raw =
    page.storedSections && page.storedSections.length > 0
      ? page.storedSections
      : hydratePageSections(page, config);
  return normalizePageSections(raw);
}

function firstOfType(sections: PageSection[], type: PageSectionType) {
  return sections.find((s) => s.type === type);
}

export function flattenSectionsToPageFields(
  sections: PageSection[],
  template: string,
): FlattenedPageFields {
  const hero = firstOfType(sections, "hero");
  const story = firstOfType(sections, "rich-text");
  const gallery = firstOfType(sections, "gallery");
  const product = firstOfType(sections, "product");
  const team = firstOfType(sections, "team");

  const title =
    asString(getSectionBlocks(hero ?? { id: "", type: "hero", enabled: true, settings: {} }).find((b) => b.type === "heading")?.settings.text) ||
    asString(hero?.settings.title);
  const heroTexts = hero ? getSectionBlocks(hero).filter((b) => b.type === "text") : [];
  const storyBlocks = story ? getSectionBlocks(story) : [];
  const storyHeading =
    asString(storyBlocks.find((b) => b.type === "heading")?.settings.text) ||
    asString(story?.settings.heading);
  const storyTexts = storyBlocks.filter((b) => b.type === "text").map((b) => asString(b.settings.text));

  const heroSubtitle = asString(heroTexts[0]?.settings.text) || asString(hero?.settings.subtitle);
  let subtitle: string | null = heroSubtitle || storyHeading || null;
  if (template === "home") {
    subtitle = storyHeading || null;
  }

  let body = "";
  if (template === "home") {
    body = JSON.stringify({
      description: storyTexts[0] ?? asString(story?.settings.description),
      paragraph: storyTexts.slice(1).join("\n\n") || asString(story?.settings.paragraph),
    });
  } else if (template === "learn-more") {
    const members = (team?.settings.members ?? []) as LearnMoreTeamMember[];
    body = serializeLearnMoreTeam(Array.isArray(members) ? members : []);
  } else if (template === "content") {
    body =
      storyTexts.join("\n\n") ||
      asString(story?.settings.body);
  }

  return {
    title,
    subtitle,
    body,
    heroImage: asString(hero?.settings.backgroundImage) || undefined,
    productImage: asString(product?.settings.image) || undefined,
    gallery: gallery ? asStringArray(gallery.settings.images).filter(Boolean) : undefined,
  };
}

export function applyFlattenedImages(
  config: SiteConfig,
  flat: FlattenedPageFields,
): SiteConfig {
  return {
    ...config,
    images: {
      ...config.images,
      ...(flat.heroImage ? { heroMug: flat.heroImage } : {}),
      ...(flat.productImage ? { productCover: flat.productImage } : {}),
      ...(flat.gallery ? { gallery: flat.gallery } : {}),
    },
  };
}

/** Drop freeform page-position buttons now that CTAs live in sections. */
export function stripPagePositionButtons(
  config: SiteConfig,
  pageSlug: string,
): SiteConfig {
  return {
    ...config,
    buttons: config.buttons
      .map((btn) => {
        if (!btn.pagePositions?.[pageSlug]) return btn;
        const nextPositions = { ...btn.pagePositions };
        delete nextPositions[pageSlug];
        return {
          ...btn,
          pagePositions:
            Object.keys(nextPositions).length > 0 ? nextPositions : undefined,
        };
      })
      .filter(
        (btn) =>
          btn.placement.includes("header") ||
          (btn.pagePositions && Object.keys(btn.pagePositions).length > 0),
      ),
  };
}

export function moveSection(
  sections: PageSection[],
  fromIndex: number,
  toIndex: number,
): PageSection[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= sections.length ||
    toIndex >= sections.length
  ) {
    return sections;
  }
  const next = [...sections];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function getTeamMembers(section: PageSection): LearnMoreTeamMember[] {
  const raw = section.settings.members;
  if (!Array.isArray(raw)) return [];
  return raw.map((member) => {
    const row = member as LearnMoreTeamMember;
    return {
      name: String(row?.name ?? ""),
      image: row?.image ? String(row.image) : "",
      bio: Array.isArray(row?.bio) ? row.bio.map(String) : [],
      coffee: row?.coffee ? String(row.coffee) : "",
    };
  });
}
