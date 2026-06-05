"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDraftTopBar } from "@/components/admin/draft/AdminDraftTopBar";
import { DraftSidebarCard } from "@/components/admin/draft/DraftSidebarCard";
import { BEAN_BOOK_2026, slugifyProductId } from "@/lib/products";

const FORM_ID = "create-product-form";

type CreateProductFormProps = {
  mode?: "create" | "edit";
  initial?: {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    imageUrl: string;
    active: boolean;
  };
};

export function CreateProductForm({
  mode = "create",
  initial,
}: CreateProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [productId, setProductId] = useState(initial?.id ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceDollars, setPriceDollars] = useState(
    initial ? (initial.priceCents / 100).toFixed(2) : "25.00",
  );
  const [imageUrl, setImageUrl] = useState(
    initial?.imageUrl ?? BEAN_BOOK_2026.imageUrl,
  );
  const [active, setActive] = useState(initial?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isEdit = mode === "edit" && initial;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    if (!Number.isFinite(priceCents) || priceCents < 50) {
      setError("Price must be at least $0.50");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name,
        description,
        priceCents,
        imageUrl,
        active,
        ...(isEdit ? {} : { id: productId.trim() || slugifyProductId(name) }),
      };

      const res = await fetch(
        isEdit ? `/api/admin/products/${initial.id}` : "/api/admin/products",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to save product");
      }

      router.push("/admin/settings/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green";

  const previewUrl = imageUrl.trim() || BEAN_BOOK_2026.imageUrl;

  return (
    <div className="space-y-4">
      <AdminDraftTopBar
        title={isEdit ? "Edit product" : "Unsaved product"}
        discardHref="/admin/settings/products"
        formId={FORM_ID}
        saveLabel="Save"
        saving={loading}
        saveDisabled={!name.trim()}
        extraActions={
          <Link
            href="/admin/orders?tab=create"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Create order
          </Link>
        }
      />

      <h1 className="text-xl font-semibold text-gray-900">
        {isEdit ? "Edit product" : "Create product"}
      </h1>

      <form id={FORM_ID} onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
          <div className="space-y-4">
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-900">
                Product details
              </h2>
              <div className="space-y-4 px-5 py-4">
                <div>
                  <label htmlFor="cp-name" className="mb-1 block text-sm font-medium">
                    Title
                  </label>
                  <input
                    id="cp-name"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!isEdit && !productId) {
                        setProductId(slugifyProductId(e.target.value));
                      }
                    }}
                    className={inputClass}
                  />
                </div>
                {!isEdit && (
                  <div>
                    <label htmlFor="cp-id" className="mb-1 block text-sm font-medium">
                      Product ID
                    </label>
                    <input
                      id="cp-id"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      placeholder="bean-book-2026-edition"
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Used in checkout and orders. Auto-generated from title if left
                      blank.
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="cp-desc" className="mb-1 block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="cp-desc"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="cp-image" className="mb-1 block text-sm font-medium">
                    Image URL
                  </label>
                  <input
                    id="cp-image"
                    required
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className={inputClass}
                  />
                </div>
                {previewUrl && (
                  <div className="relative h-24 w-24 overflow-hidden rounded border border-gray-200">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-900">
                Pricing
              </h2>
              <div className="px-5 py-4">
                <label htmlFor="cp-price" className="mb-1 block text-sm font-medium">
                  Price
                </label>
                <div className="flex max-w-xs items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <input
                    id="cp-price"
                    type="number"
                    min={0.5}
                    step={0.01}
                    required
                    value={priceDollars}
                    onChange={(e) => setPriceDollars(e.target.value)}
                    className={inputClass}
                  />
                  <span className="text-sm text-gray-500">USD</span>
                </div>
              </div>
            </section>

            {error && (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
          </div>

          <aside className="space-y-4">
            <DraftSidebarCard title="Status">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                />
                Active — available for new orders and checkout
              </label>
            </DraftSidebarCard>

            <DraftSidebarCard title="Preview">
              <p className="text-sm text-gray-600">
                {isEdit ? (
                  <Link
                    href={`/products/${initial.id}`}
                    className="text-brand-green hover:underline"
                    target="_blank"
                  >
                    View on site →
                  </Link>
                ) : (
                  "Save the product to link it from your store."
                )}
              </p>
            </DraftSidebarCard>
          </aside>
        </div>
      </form>
    </div>
  );
}
