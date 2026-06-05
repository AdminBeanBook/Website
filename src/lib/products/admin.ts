import { prisma } from "@/lib/db";
import { BEAN_BOOK_2026, slugifyProductId } from "@/lib/products";

export { slugifyProductId };

export function listAdminProducts() {
  return prisma.product.findMany({ orderBy: { name: "asc" } });
}

export function getAdminProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
}

export type CreateProductInput = {
  id?: string;
  name: string;
  description?: string;
  priceCents: number;
  imageUrl: string;
  active?: boolean;
};

export async function createProduct(input: CreateProductInput) {
  const id = (input.id?.trim() || slugifyProductId(input.name)).toLowerCase();
  const existing = await prisma.product.findUnique({ where: { id } });
  if (existing) {
    throw new Error("A product with this ID already exists");
  }

  return prisma.product.create({
    data: {
      id,
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      priceCents: input.priceCents,
      imageUrl: input.imageUrl.trim(),
      active: input.active ?? true,
    },
  });
}

export type UpdateProductInput = Partial<CreateProductInput>;

export async function updateProduct(id: string, input: UpdateProductInput) {
  return prisma.product.update({
    where: { id },
    data: {
      name: input.name?.trim(),
      description: input.description?.trim(),
      priceCents: input.priceCents,
      imageUrl: input.imageUrl?.trim(),
      active: input.active,
    },
  });
}

export async function seedDefaultProductIfEmpty() {
  const count = await prisma.product.count();
  if (count > 0) return;

  await prisma.product.create({
    data: {
      id: BEAN_BOOK_2026.id,
      name: BEAN_BOOK_2026.name,
      description: BEAN_BOOK_2026.description,
      priceCents: BEAN_BOOK_2026.priceCents,
      imageUrl: BEAN_BOOK_2026.imageUrl,
      active: true,
    },
  });
}
