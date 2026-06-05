"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AdminDraftTopBar } from "@/components/admin/draft/AdminDraftTopBar";
import { DraftSidebarCard } from "@/components/admin/draft/DraftSidebarCard";
import type { CatalogProduct } from "@/lib/products";
import { formatMoney } from "@/lib/orders/display";

const FORM_ID = "create-manual-order-form";

type CreateManualOrderFormProps = {
  products: CatalogProduct[];
};

export function CreateManualOrderForm({ products }: CreateManualOrderFormProps) {
  const router = useRouter();
  const defaultProduct = products[0];
  const [productId, setProductId] = useState(defaultProduct?.id ?? "");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [shippingName, setShippingName] = useState("");
  const [shippingLine1, setShippingLine1] = useState("");
  const [shippingLine2, setShippingLine2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingPostal, setShippingPostal] = useState("");
  const [notes, setNotes] = useState("");
  const [sendInvoice, setSendInvoice] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const product = useMemo(
    () => products.find((p) => p.id === productId) ?? defaultProduct,
    [products, productId, defaultProduct],
  );

  const subtotalCents = (product?.priceCents ?? 0) * quantity;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          customerEmail,
          customerName: customerName || undefined,
          customerPhone: customerPhone || undefined,
          quantity,
          shippingName: shippingName || undefined,
          shippingLine1: shippingLine1 || undefined,
          shippingLine2: shippingLine2 || undefined,
          shippingCity: shippingCity || undefined,
          shippingState: shippingState || undefined,
          shippingPostal: shippingPostal || undefined,
          notes: notes || undefined,
          sendInvoice,
        }),
      });
      const data = (await res.json()) as { error?: string; id?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to create order");
      }

      if (data.id) {
        router.push(`/admin/orders/${data.id}?from=unpaid`);
      } else {
        router.push("/admin/orders?tab=unpaid");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
      setLoading(false);
    }
  }

  if (!product) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        No products in your catalog.{" "}
        <Link href="/admin/settings/products/create" className="font-medium underline">
          Create a product
        </Link>{" "}
        first.
      </div>
    );
  }

  const inputClass =
    "w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green";

  return (
    <div className="space-y-4">
      <AdminDraftTopBar
        title="Unsaved draft order"
        discardHref="/admin/orders?tab=unpaid"
        formId={FORM_ID}
        saveLabel={sendInvoice ? "Save & send invoice" : "Save order"}
        saving={loading}
        saveDisabled={!customerEmail.trim()}
        extraActions={
          <Link
            href="/admin/settings/products/create"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Create product
          </Link>
        }
      />

      <h1 className="text-xl font-semibold text-gray-900">Create order</h1>

      <form id={FORM_ID} onSubmit={handleSubmit}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
          <div className="space-y-4">
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
                <h2 className="text-sm font-semibold text-gray-900">Products</h2>
                {products.length > 1 && (
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                    aria-label="Product"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-4 px-5 py-4">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    {formatMoney(product.priceCents)} each
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm"
                    aria-label="Quantity"
                  />
                  <span className="w-16 text-right text-sm font-medium tabular-nums">
                    {formatMoney(subtotalCents)}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <h2 className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-900">
                Payment
              </h2>
              <dl className="divide-y divide-gray-100 text-sm">
                <div className="flex justify-between px-5 py-2.5">
                  <dt className="text-gray-600">Subtotal</dt>
                  <dd className="tabular-nums font-medium">
                    {formatMoney(subtotalCents)}
                  </dd>
                </div>
                <div className="flex justify-between px-5 py-3 text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatMoney(subtotalCents)}</dd>
                </div>
              </dl>
              <div className="border-t border-gray-100 px-5 py-4">
                <label className="flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={sendInvoice}
                    onChange={(e) => setSendInvoice(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>
                    <strong>Payment due later</strong> — email a Stripe invoice
                    after saving (due in 30 days). You can ship before payment from
                    the Unpaid tab.
                  </span>
                </label>
              </div>
              <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
                Use <strong>Save</strong> in the top bar to create this order.
              </p>
            </section>

            {error && (
              <p className="text-sm text-red-700" role="alert">
                {error}
              </p>
            )}
          </div>

          <aside className="space-y-4">
            <DraftSidebarCard title="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="No notes"
                rows={3}
                className={inputClass}
              />
            </DraftSidebarCard>

            <DraftSidebarCard title="Customer">
              <div className="space-y-3">
                <div>
                  <label htmlFor="co-email" className="mb-1 block text-xs text-gray-500">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="co-email"
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Search or create a customer"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="co-name" className="mb-1 block text-xs text-gray-500">
                    Name
                  </label>
                  <input
                    id="co-name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="co-phone" className="mb-1 block text-xs text-gray-500">
                    Phone
                  </label>
                  <input
                    id="co-phone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </DraftSidebarCard>

            <DraftSidebarCard title="Shipping address">
              <div className="space-y-2">
                <input
                  placeholder="Recipient name"
                  value={shippingName}
                  onChange={(e) => setShippingName(e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="Street address"
                  value={shippingLine1}
                  onChange={(e) => setShippingLine1(e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="Apt / suite"
                  value={shippingLine2}
                  onChange={(e) => setShippingLine2(e.target.value)}
                  className={inputClass}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="City"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    placeholder="State"
                    value={shippingState}
                    onChange={(e) => setShippingState(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <input
                  placeholder="ZIP"
                  value={shippingPostal}
                  onChange={(e) => setShippingPostal(e.target.value)}
                  className={inputClass}
                />
              </div>
            </DraftSidebarCard>

            <DraftSidebarCard title="Market">
              <p className="text-sm text-gray-700">United States</p>
              <p className="mt-2 text-xs text-gray-500">Currency</p>
              <p className="text-sm text-gray-700">US Dollar (USD $)</p>
            </DraftSidebarCard>
          </aside>
        </div>
      </form>
    </div>
  );
}
