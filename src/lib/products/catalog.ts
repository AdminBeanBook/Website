import { IMAGES } from "@/lib/site";

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: "usd";
  imageUrl: string;
  active?: boolean;
  preorder?: boolean;
};

export const BEAN_BOOK_2026: CatalogProduct = {
  id: "bean-book-2026-edition",
  name: "Bean Book: 2026 Edition",
  description:
    "Denver coffee passbook — 27 featured shops with exclusive discounts, location details, and journal pages.",
  priceCents: 2500,
  currency: "usd",
  imageUrl: IMAGES.productCover,
};

export const BEAN_BOOK_2027: CatalogProduct = {
  id: "bean-book-2027-edition",
  name: "Bean Book: 2027 Edition (Pre-Order)",
  description:
    "Pre-order the Denver coffee passbook for 2027 — featured shops with exclusive discounts, location details, and journal pages. Ships when the 2027 edition is released.",
  priceCents: 2500,
  currency: "usd",
  imageUrl: IMAGES.productCover2027,
  preorder: true,
};

export const FALLBACK_CATALOG: CatalogProduct[] = [
  BEAN_BOOK_2026,
  BEAN_BOOK_2027,
];

export function formatPriceLabel(cents: number): string {
  return `$${(cents / 100).toFixed(2)} USD`;
}

export function isPreorderProduct(
  product: Pick<CatalogProduct, "id" | "name" | "preorder">,
): boolean {
  if (product.preorder) return true;
  if (product.id === BEAN_BOOK_2027.id) return true;
  return /pre-?order/i.test(product.name);
}

export function getFallbackProduct(id: string): CatalogProduct | undefined {
  return FALLBACK_CATALOG.find((product) => product.id === id);
}

export function slugifyProductId(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "product";
}
