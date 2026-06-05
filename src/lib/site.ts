export const SITE = {
  name: "The Bean Book",
  tagline: "Where Coffee Cravers meet Coffee Creators",
  description:
    "The Bean Book is a Denver coffee passbook, a connector for coffee cravers and coffee creators in Denver and beyond.",
  facebook: "https://www.facebook.com/thebeanbookco",
  instagram: "https://www.instagram.com/thebeanbookco",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/purchase", label: "Purchase" },
  { href: "/map", label: "Map & Coffee Shops" },
  { href: "/learn-more", label: "Learn More" },
  { href: "/contact", label: "Contact Us" },
  { href: "/so-what-is-it", label: "So, what is it?" },
] as const;

export const IMAGES = {
  logo: "https://thebeanbook.org/cdn/shop/files/logo_no_background_80x.png?v=1644446296",
  heroMug:
    "https://thebeanbook.org/cdn/shop/files/pexels-artempodrez-6801175_1500x.jpg?v=1729018263",
  productCover:
    "https://thebeanbook.org/cdn/shop/files/tbbfrontcover_533x.png?v=1765760938",
  gallery: [
    "https://thebeanbook.org/cdn/shop/files/2O0A9213_f2372789-cebc-463d-8c0e-dba94160ae48_550x.jpg?v=1672969104",
    "https://thebeanbook.org/cdn/shop/files/IMG_20220206_101546_026_786cf954-7e88-43e5-80f0-7927b52d7d8d_550x.webp?v=1672969204",
    "https://thebeanbook.org/cdn/shop/files/3L0A9312_copy_37c83f4e-ae10-4707-b738-629ca05aa4e0_550x.jpg?v=1672969157",
    "https://thebeanbook.org/cdn/shop/files/928159C9-B725-4F04-89BD-543231684FAB_1_201_a_18dc1282-372c-4ad4-9e20-045b4a1b36fb_550x.jpg?v=1672969176",
  ],
  team: {
    john: "https://thebeanbook.org/cdn/shop/files/website_martin_400x.png?v=1644464988",
  },
} as const;
