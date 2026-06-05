import Link from "next/link";
import { CreateManualOrderForm } from "@/components/admin/CreateManualOrderForm";
import { OrderListRow } from "@/components/admin/OrderListRow";
import { OrderTabs } from "@/components/admin/OrderTabs";
import { StripeSetupBanner } from "@/components/admin/StripeSetupBanner";
import { prisma } from "@/lib/db";
import { listCatalogProducts } from "@/lib/products";
import {
  ORDER_TABS,
  isCreateTab,
  orderMatchesTab,
  parseOrderTab,
  tabLabel,
  type OrderTab,
} from "@/lib/orders/status";

type OrdersPageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function emptyMessage(tab: OrderTab): string {
  switch (tab) {
    case "unpaid":
      return "No unpaid orders. Use the Create order tab to add a retail or bulk order.";
    case "create":
      return "";
    case "unfulfilled":
      return "No paid orders waiting to ship. Orders appear here after payment until a label is purchased.";
    case "archived":
      return "No archived orders yet. Fulfilled orders move here after you buy a shipping label.";
    default:
      return "No orders yet. Stripe checkout or a manual unpaid order will appear here.";
  }
}

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const { tab: tabParam } = await searchParams;
  const activeTab = parseOrderTab(tabParam);

  const allOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      customerEmail: true,
      customerName: true,
      amountCents: true,
      status: true,
      createdAt: true,
      stripeSessionId: true,
      labelUrl: true, // required for unfulfilled tab filter
      trackingNumber: true,
      invoiceSentAt: true,
      discountCode: true,
    },
  });

  const counts = ORDER_TABS.reduce(
    (acc, tab) => {
      acc[tab] =
        tab === "create"
          ? 0
          : allOrders.filter((o) => orderMatchesTab(o, tab)).length;
      return acc;
    },
    {} as Record<OrderTab, number>,
  );

  const orders = isCreateTab(activeTab)
    ? []
    : allOrders.filter((o) => orderMatchesTab(o, activeTab));

  const catalogProducts = isCreateTab(activeTab)
    ? await listCatalogProducts(true)
    : [];

  return (
    <div className="space-y-6">
      {!isCreateTab(activeTab) && (
        <h1 className="text-2xl font-semibold">Orders</h1>
      )}

      <StripeSetupBanner />

      <OrderTabs activeTab={activeTab} counts={counts} />

      {isCreateTab(activeTab) ? (
        <CreateManualOrderForm products={catalogProducts} />
      ) : orders.length === 0 ? (
        <p className="text-gray-500">{emptyMessage(activeTab)}</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="hidden border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 sm:grid sm:grid-cols-[7rem_minmax(0,1fr)_5rem_5.5rem_auto] sm:gap-x-4">
            <span>Date</span>
            <span>Customer</span>
            <span className="text-right">Total</span>
            <span>Status</span>
            <span className="text-right">Notes</span>
          </div>
          <div role="list">
            {orders.map((order) => (
              <OrderListRow
                key={order.id}
                order={order}
                fromTab={activeTab}
              />
            ))}
          </div>
        </div>
      )}

      {!isCreateTab(activeTab) && activeTab !== "all" && orders.length > 0 && (
        <p className="text-sm text-gray-500">
          Showing {tabLabel(activeTab).toLowerCase()} orders only.{" "}
          <Link href="/admin/orders" className="text-brand-green hover:underline">
            View all
          </Link>
        </p>
      )}

      <Link href="/admin" className="text-sm text-brand-green hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
