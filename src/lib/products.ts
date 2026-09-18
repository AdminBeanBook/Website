import { prisma } from "@/lib/db";
import {
  BEAN_BOOK_2026,
  BEAN_BOOK_2027,
  FALLBACK_CATALOG,
  getFallbackProduct,
  isPreorderProduct,
  type CatalogProduct,
} from "@/lib/products/catalog";
import { IMAGES } from "@/lib/site";

export type { CatalogProduct } from "@/lib/products/catalog";
export {
  BEAN_BOOK_2026,
  BEAN_BOOK_2027,
  FALLBACK_CATALOG,
  formatPriceLabel,
  getFallbackProduct,
  isPreorderProduct,
  slugifyProductId,
} from "@/lib/products/catalog";

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
    preorder: isPreorderProduct(row),
  };
}

export async function ensureFallbackCatalogProducts() {
  try {
    for (const product of FALLBACK_CATALOG) {
      await prisma.product.upsert({
        where: { id: product.id },
        create: {
          id: product.id,
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
          imageUrl: product.imageUrl,
          active: true,
        },
        update: {},
      });
    }

    // Migrate 2027 cover if it still points at the 2026 CDN image.
    await prisma.product.updateMany({
      where: {
        id: BEAN_BOOK_2027.id,
        imageUrl: IMAGES.productCover,
      },
      data: { imageUrl: BEAN_BOOK_2027.imageUrl },
    });
  } catch {
    // Table may not exist before migration
  }
}

export async function listCatalogProducts(activeOnly = false) {
  await ensureFallbackCatalogProducts();
  try {
    const rows = await prisma.product.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { name: "asc" },
    });
    if (rows.length > 0) return rows.map(toCatalog);
  } catch {
    // Table may not exist before migration
  }
  return FALLBACK_CATALOG.filter((product) =>
    activeOnly ? product.active !== false : true,
  );
}

export async function getProductById(
  id: string,
): Promise<CatalogProduct | null> {
  await ensureFallbackCatalogProducts();
  try {
    const row = await prisma.product.findUnique({ where: { id } });
    if (row) return row.active !== false ? toCatalog(row) : null;
  } catch {
    // fall through to hardcoded catalog
  }
  return getFallbackProduct(id) ?? null;
}

export async function resolveProduct(
  id?: string | null,
): Promise<CatalogProduct> {
  if (id) {
    const found = await getProductById(id);
    if (found) return found;
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
