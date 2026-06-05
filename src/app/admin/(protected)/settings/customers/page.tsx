import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminCustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
      _count: { select: { orders: true } },
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Customers</h1>

      {customers.length === 0 ? (
        <p className="text-gray-500">Customers appear here after their first order.</p>
      ) : (
        <div className="space-y-4">
          {customers.map((customer) => (
            <article
              key={customer.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium">{customer.email}</p>
                  <p className="text-sm text-gray-600">
                    {customer.name ?? "No name"} · {customer.phone ?? "No phone"}
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  {customer._count.orders} order
                  {customer._count.orders === 1 ? "" : "s"}
                </p>
              </div>
              {customer.orders.length > 0 && (
                <ul className="mt-3 space-y-1 border-t pt-3 text-sm text-gray-600">
                  {customer.orders.map((order) => (
                    <li key={order.id}>
                      {order.createdAt.toLocaleDateString()} — $
                      {(order.amountCents / 100).toFixed(2)} ({order.status})
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}

      <Link href="/admin" className="text-sm text-brand-green hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
