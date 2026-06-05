import { notFound } from "next/navigation";
import { CreateProductForm } from "@/components/admin/CreateProductForm";
import { getAdminProductById } from "@/lib/products/admin";

type ProductEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({
  params,
}: ProductEditPageProps) {
  const { id } = await params;
  const product = await getAdminProductById(id);
  if (!product) notFound();

  return (
    <CreateProductForm
      mode="edit"
      initial={{
        id: product.id,
        name: product.name,
        description: product.description,
        priceCents: product.priceCents,
        imageUrl: product.imageUrl,
        active: product.active,
      }}
    />
  );
}
