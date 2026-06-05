import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const [orderCount, customerCount, unreadMessages, activeDiscounts, packageCount] =
    await Promise.all([
      prisma.order.count(),
      prisma.customer.count(),
      prisma.contactSubmission.count({ where: { read: false } }),
      prisma.discountCode.count({ where: { active: true } }),
      prisma.packagePreset.count(),
    ]);

  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const cards = [
    { label: "Orders", value: orderCount, href: "/admin/orders" },
    { label: "Customers", value: customerCount, href: "/admin/settings/customers" },
    { label: "Unread messages", value: unreadMessages, href: "/admin/messages" },
    { label: "Active discount codes", value: activeDiscounts, href: "/admin/settings/discounts" },
    { label: "Shipping packages", value: packageCount, href: "/admin/settings/packages" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:border-brand-green/30"
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-semibold text-brand-green">{value}</p>
          </Link>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium">Recent orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-gray-500">No orders yet. Test checkout to create one.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {order.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{order.customerEmail}</td>
                    <td className="px-4 py-3">
                      ${(order.amountCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {order.status === "shipped" ? "archived" : order.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
