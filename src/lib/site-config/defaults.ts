import { NAV_LINKS, SITE, IMAGES } from "@/lib/site";
import type { SiteConfig } from "@/lib/site-config/types";

export const SITE_SETTINGS_ID = "default";

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  site: {
    name: SITE.name,
    tagline: SITE.tagline,
    description: SITE.description,
    facebook: SITE.facebook,
    instagram: SITE.instagram,
  },
  colors: {
    green: "#1e3a3a",
    header: "#2D3E40",
    beige: "#d9cbb7",
    cream: "#e5d8c1",
    accent: "#c47a3a",
    text: {
      heading: "#2D3E40",
      body: "#2D3E40",
      muted: "#2D3E40",
      link: "#c47a3a",
    },
  },
  images: {
    logo: IMAGES.logo,
    heroMug: IMAGES.heroMug,
    productCover: IMAGES.productCover,
    gallery: [...IMAGES.gallery],
  },
  nav: [
    { id: "nav-home", label: "Home", href: "/", enabled: true, system: true },
    {
      id: "nav-purchase",
      label: "Purchase",
      href: "/purchase",
      enabled: true,
      system: true,
    },
    {
      id: "nav-map",
      label: "Map & Coffee Shops",
      href: "/map",
      enabled: true,
      system: true,
    },
    {
      id: "nav-learn",
      label: "Learn More",
      href: "/learn-more",
      enabled: true,
    },
    {
      id: "nav-contact",
      label: "Contact Us",
      href: "/contact",
      enabled: true,
      system: true,
    },
    {
      id: "nav-so-what",
      label: "So, what is it?",
      href: "/so-what-is-it",
      enabled: true,
    },
  ],
  buttons: [
    {
      id: "btn-header-buy",
      label: "Buy Now",
      href: "/purchase",
      style: "primary",
      action: "link",
      placement: ["header"],
      enabled: true,
    },
    {
      id: "btn-home-hero",
      label: "Buy Now",
      href: "/purchase",
      style: "primary",
      action: "link",
      placement: [],
      pagePositions: { home: { x: 50, y: 62 } },
      enabled: true,
    },
    {
      id: "btn-home-learn",
      label: "learn more",
      href: "/so-what-is-it",
      style: "outline",
      action: "link",
      placement: [],
      pagePositions: { home: { x: 50, y: 72 } },
      enabled: true,
    },
    {
      id: "btn-purchase-checkout",
      label: "Buy Now — $25",
      href: "/purchase",
      style: "primary",
      action: "checkout",
      placement: [],
      pagePositions: { purchase: { x: 50, y: 58 } },
      enabled: false,
    },
  ],
};
