export type SiteTextColors = {
  heading: string;
  body: string;
  muted: string;
  link: string;
};

export type BrandColors = {
  /** Main brand color (primary surfaces, borders) */
  green: string;
  /** Top navigation bar background */
  header: string;
  beige: string;
  cream: string;
  accent: string;
  /** Site-wide text color defaults (overridable per page element) */
  text: SiteTextColors;
};

export type SiteImages = {
  logo: string;
  heroMug: string;
  productCover: string;
  gallery: string[];
};

export type NavLinkConfig = {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  /** Built-in links (map, admin) cannot be deleted */
  system?: boolean;
};

export type ButtonStyle = "primary" | "outline";
export type ButtonAction = "link" | "checkout";

export type PageButtonPosition = {
  x: number;
  y: number;
};

export type SiteButtonConfig = {
  id: string;
  label: string;
  href: string;
  style: ButtonStyle;
  action: ButtonAction;
  /** Fixed slots (e.g. header). Page body buttons use pagePositions instead. */
  placement: string[];
  /** Free placement per page slug (% of #bb-page-canvas). */
  pagePositions?: Record<string, PageButtonPosition>;
  enabled: boolean;
};

export type SiteInfo = {
  name: string;
  tagline: string;
  description: string;
  facebook: string;
  instagram: string;
};

export type SiteConfig = {
  site: SiteInfo;
  colors: BrandColors;
  images: SiteImages;
  nav: NavLinkConfig[];
  buttons: SiteButtonConfig[];
};

export type PageTemplate =
  | "home"
  | "purchase"
  | "contact"
  | "map"
  | "content"
  | "so-what-is-it"
  | "learn-more";

export const BUTTON_PLACEMENTS = [
  { id: "header", label: "Header" },
  { id: "home-hero", label: "Home hero" },
  { id: "home-content", label: "Home content section" },
  { id: "purchase", label: "Purchase page" },
] as const;

export type ButtonPlacement = (typeof BUTTON_PLACEMENTS)[number]["id"];
