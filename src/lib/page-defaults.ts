import { serializeLearnMoreTeam, defaultLearnMoreTeamBody } from "@/lib/pages/learn-more-team";
import type { PageTemplate } from "@/lib/site-config/types";

export type PageSlug = string;

export type PageDefault = {
  slug: string;
  path: string;
  template: PageTemplate;
  isSystem: boolean;
  showInNav: boolean;
  sortOrder: number;
  title: string;
  subtitle?: string;
  body: string;
};

export const PAGE_DEFAULTS: PageDefault[] = [
  {
    slug: "home",
    path: "/",
    template: "home",
    isSystem: true,
    showInNav: false,
    sortOrder: 0,
    title: "Where Coffee Cravers meet Coffee Creators",
    subtitle: "The Bean Book",
    body: JSON.stringify({
      description:
        "The Bean Book is a Denver coffee passbook, a connector for coffee cravers and coffee creators in Denver and beyond.",
      paragraph:
        "When you purchase a Bean Book, you get a book packed with 27 coffee shops all of which have exclusive coffee discounts to use for the year. Enjoy multiple discounts from each featured coffee shop and easy access to information about locations, websites, and menus. Use the journal pages to scribble down highlights about each of your coffee adventures. Have the time of your life!",
    }),
  },
  {
    slug: "purchase",
    path: "/purchase",
    template: "purchase",
    isSystem: true,
    showInNav: false,
    sortOrder: 1,
    title: "Order your Book Today!",
    subtitle:
      "The Bean Book: 2026 Edition is officially up for sale! Click on the book below to order yours today!",
    body: "",
  },
  {
    slug: "contact",
    path: "/contact",
    template: "contact",
    isSystem: true,
    showInNav: false,
    sortOrder: 2,
    title: "contact",
    body: "",
  },
  {
    slug: "map",
    path: "/map",
    template: "map",
    isSystem: true,
    showInNav: false,
    sortOrder: 3,
    title: "Meet the Coffee Creators",
    subtitle: "2026 Map — Denver Metro Shops",
    body: "",
  },
  {
    slug: "so-what-is-it",
    path: "/so-what-is-it",
    template: "so-what-is-it",
    isSystem: true,
    showInNav: false,
    sortOrder: 4,
    title: "The Whole Idea",
    subtitle: "What Is The Bean Book?",
    body: "",
  },
  {
    slug: "learn-more",
    path: "/learn-more",
    template: "learn-more",
    isSystem: true,
    showInNav: false,
    sortOrder: 5,
    title: "The BB Creators",
    body: serializeLearnMoreTeam(defaultLearnMoreTeamBody().members),
  },
];

export function getDefaultPage(slug: string): PageDefault | undefined {
  return PAGE_DEFAULTS.find((p) => p.slug === slug);
}

export function slugifyPageSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "page";
}
