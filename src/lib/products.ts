import { IMAGES } from "@/lib/site";
import { prisma } from "@/lib/db";

export type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: "usd";
  imageUrl: string;
  active?: boolean;
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

function toCatalog(row: {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  imageUrl: string;
  active?: boolean;
}): CatalogProduct {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.priceCents,
    currency: "usd",
    imageUrl: row.imageUrl,
    active: row.active,
  };
}

export async function listCatalogProducts(activeOnly = false) {
  try {
    const rows = await prisma.product.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { name: "asc" },
    });
    if (rows.length > 0) return rows.map(toCatalog);
  } catch {
    // Table may not exist before migration
  }
  return [BEAN_BOOK_2026];
}

export async function resolveProduct(
  id?: string | null,
): Promise<CatalogProduct> {
  if (id) {
    try {
      const row = await prisma.product.findUnique({ where: { id } });
      if (row && row.active !== false) return toCatalog(row);
    } catch {
      // fall through
    }
    if (id === BEAN_BOOK_2026.id) return BEAN_BOOK_2026;
  }

  try {
    const row = await prisma.product.findFirst({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
    if (row) return toCatalog(row);
  } catch {
    // fall through
  }

  return BEAN_BOOK_2026;
}

export function slugifyProductId(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "product";
}
