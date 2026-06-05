import type { SiteTextColors } from "@/lib/site-config/types";

export type TextColorRole = keyof SiteTextColors;

export type PageTextSlot = {
  id: string;
  label: string;
  /** Fallback when this page has no override */
  defaultRole: TextColorRole;
  /** Optional fixed default (e.g. white hero on home image) */
  defaultHex?: string;
};

const HERO: PageTextSlot[] = [
  {
    id: "heroTitle",
    label: "Hero title",
    defaultRole: "heading",
  },
  {
    id: "heroSubtitle",
    label: "Hero subtitle",
    defaultRole: "muted",
  },
];

const SLOTS_BY_TEMPLATE: Record<string, PageTextSlot[]> = {
  content: [
    ...HERO,
    { id: "body", label: "Body paragraphs", defaultRole: "body" },
  ],
  contact: [{ id: "heroTitle", label: "Hero title", defaultRole: "heading" }],
  map: [
    ...HERO,
    {
      id: "sectionHeading",
      label: '"2026 Map" heading',
      defaultRole: "heading",
    },
    {
      id: "sectionSubtext",
      label: "Section subtext",
      defaultRole: "muted",
    },
    {
      id: "cardTitle",
      label: "Shop card titles",
      defaultRole: "heading",
    },
    {
      id: "cardBody",
      label: "Shop card addresses",
      defaultRole: "body",
    },
    {
      id: "cardLink",
      label: "Shop website links",
      defaultRole: "link",
    },
  ],
  purchase: [
    ...HERO,
    {
      id: "productTitle",
      label: "Product title",
      defaultRole: "heading",
    },
    {
      id: "productPrice",
      label: "Product price",
      defaultRole: "body",
    },
    {
      id: "finePrint",
      label: "Fine print",
      defaultRole: "muted",
    },
  ],
  home: [
    {
      id: "heroTitle",
      label: "Hero title",
      defaultRole: "heading",
      defaultHex: "#ffffff",
    },
    {
      id: "sectionTitle",
      label: "Section heading",
      defaultRole: "heading",
    },
    {
      id: "sectionBody",
      label: "Section paragraphs",
      defaultRole: "body",
    },
  ],
  "learn-more": [
    ...HERO,
    {
      id: "memberName",
      label: "Team member names",
      defaultRole: "heading",
    },
    {
      id: "memberBio",
      label: "Team member bios",
      defaultRole: "body",
    },
  ],
  "so-what-is-it": [
    ...HERO,
    {
      id: "sectionHeading",
      label: "Section headings",
      defaultRole: "heading",
    },
    {
      id: "body",
      label: "Body paragraphs & lists",
      defaultRole: "body",
    },
  ],
};

export function getPageTextSlots(template: string): PageTextSlot[] {
  return SLOTS_BY_TEMPLATE[template] ?? SLOTS_BY_TEMPLATE.content;
}
