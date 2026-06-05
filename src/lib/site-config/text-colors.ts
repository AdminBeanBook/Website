import type { SiteTextColors } from "@/lib/site-config/types";

export const DEFAULT_SITE_TEXT_COLORS: SiteTextColors = {
  heading: "#2D3E40",
  body: "#2D3E40",
  muted: "#2D3E40",
  link: "#c47a3a",
};

export const SITE_TEXT_COLOR_FIELDS: {
  key: keyof SiteTextColors;
  label: string;
}[] = [
  { key: "heading", label: "Headings (default)" },
  { key: "body", label: "Body (default)" },
  { key: "muted", label: "Secondary (default)" },
  { key: "link", label: "Links (default)" },
];

/** Migrate legacy single hex `text` string to role map. */
export function normalizeSiteTextColors(
  text: SiteTextColors | string | undefined,
  accentFallback: string,
): SiteTextColors {
  if (typeof text === "string") {
    return {
      heading: text,
      body: text,
      muted: text,
      link: accentFallback,
    };
  }
  return {
    ...DEFAULT_SITE_TEXT_COLORS,
    ...text,
    link: text?.link ?? accentFallback,
  };
}
