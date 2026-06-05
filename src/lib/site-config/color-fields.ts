import type { BrandColors } from "@/lib/site-config/types";

export type BrandSurfaceColorKey = Exclude<keyof BrandColors, "text">;

export const BRAND_COLOR_FIELDS: {
  key: BrandSurfaceColorKey;
  label: string;
}[] = [
  { key: "green", label: "Main" },
  { key: "header", label: "Header" },
  { key: "beige", label: "Accent 1" },
  { key: "cream", label: "Accent 2" },
  { key: "accent", label: "Accent 3" },
];
