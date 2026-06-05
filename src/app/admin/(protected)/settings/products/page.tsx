import Image from "next/image";
import Link from "next/link";
import { listAdminProducts } from "@/lib/products/admin";
import { formatMoney } from "@/lib/orders/display";

export default async function AdminProductsPage() {
  let products: Awaited<ReturnType<typeof listAdminProducts>> = [];
  try {
    products = await listAdminProducts();
  } catch {
    products = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Catalog items available for checkout and manual orders.
          </p>
        </div>
        <Link
          href="/admin/settings/products/create"
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Create product
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">
          No products yet.{" "}
          <Link href="/admin/settings/products/create" className="text-brand-green hover:underline">
            Create your first product
          </Link>{" "}
          or run <code className="text-xs">npm run db:seed</code>.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {products.map((product) => (
              <li key={product.id}>
                <Link
                  href={`/admin/settings/products/${product.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition hover:bg-gray-50"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-gray-200">
                    <Image
                      src={product.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="truncate text-xs text-gray-500">{product.id}</p>
                  </div>
                  <span className="text-sm font-medium tabular-nums">
                    {formatMoney(product.priceCents)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      product.active
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {product.active ? "Active" : "Draft"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/admin/orders?tab=create" className="text-sm text-brand-green hover:underline">
        ← Create order
      </Link>
    </div>
  );
}
