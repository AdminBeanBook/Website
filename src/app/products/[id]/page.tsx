import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuyButton } from "@/components/BuyButton";
import {
  formatPriceLabel,
  isPreorderProduct,
} from "@/lib/products/catalog";
import { getProductById } from "@/lib/products";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Product" };
  return { title: product.name };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const preorder = isPreorderProduct(product);

  return (
    <section className="px-6 py-16">
      <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
          {preorder ? (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-brand-accent px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Pre-order
            </span>
          ) : null}
          <Image
            src={product.imageUrl}
            alt={`${product.name} cover`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
            unoptimized={product.imageUrl.startsWith("/uploads/")}
          />
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-light text-brand-text">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl text-brand-text/80">
            {formatPriceLabel(product.priceCents)}
          </p>
          <p className="mt-6 leading-relaxed text-brand-text/90">
            {product.description}
          </p>
          <div className="mt-8 flex flex-wrap items-start gap-4">
            <BuyButton
              productId={product.id}
              label={`Buy Now — $${(product.priceCents / 100).toFixed(0)}`}
            />
            <Link href="/purchase" className="btn-outline">
              Back to shop
            </Link>
          </div>
          <p className="mt-6 text-sm text-brand-text/60">
            {preorder
              ? "Pre-order via Stripe Checkout. Ships when the 2027 edition is released."
              : "Secure payment via Stripe Checkout."}
          </p>
        </div>
      </div>
    </section>
  );
}
