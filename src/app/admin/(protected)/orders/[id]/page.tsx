import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderActions } from "@/components/admin/OrderActions";
import { OrderBadge } from "@/components/admin/order-detail/OrderBadge";
import { OrderCustomerSidebar } from "@/components/admin/order-detail/OrderCustomerSidebar";
import { OrderDetailNav } from "@/components/admin/order-detail/OrderDetailNav";
import { OrderFulfillmentCard } from "@/components/admin/order-detail/OrderFulfillmentCard";
import { OrderPaymentCard } from "@/components/admin/order-detail/OrderPaymentCard";
import {
  getAdjacentOrderIds,
  getAdminOrderById,
  getCustomerOrderCount,
  getOrderDisplaySequence,
} from "@/lib/orders/admin-query";
import {
  formatOrderDate,
  formatOrderNumber,
  getFulfillmentBadge,
  getPaymentBadge,
  orderSourceLabel,
} from "@/lib/orders/display";
import { orderHasShipToAddress } from "@/lib/shipping/orders";
import {
  getShippoConfigMissing,
  isShippoConfigured,
} from "@/lib/shipping/config";
import { listPackagePresets } from "@/lib/shipping/packages";
import {
  isManualOrder,
  parseOrderTab,
  shouldShowShippingPanel,
  tabLabel,
} from "@/lib/orders/status";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
};

function backHref(from?: string): string {
  const tab = parseOrderTab(from);
  return tab === "all" ? "/admin/orders" : `/admin/orders?tab=${tab}`;
}

function backLabel(from?: string): string {
  const tab = parseOrderTab(from);
  if (tab === "all") return "Orders";
  return `${tabLabel(tab)} orders`;
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: OrderDetailPageProps) {
  const { id } = await params;
  const { from } = await searchParams;
  const fromTab = parseOrderTab(from);
  const fromQuery = fromTab === "all" ? "" : fromTab;

  const order = await getAdminOrderById(id);
  if (!order) notFound();

  const [
    packages,
    sequence,
    adjacent,
    customerOrderCount,
  ] = await Promise.all([
    listPackagePresets(),
    getOrderDisplaySequence(order.id, order.createdAt),
    getAdjacentOrderIds(order.createdAt, order.id),
    getCustomerOrderCount(order.customerId, order.customerEmail),
  ]);

  const shippoConfigured = isShippoConfigured();
  const shippoConfigMissing = getShippoConfigMissing();
  const defaultPackageId =
    packages.find((p) => p.isDefault)?.id ?? packages[0]?.id ?? null;

  const payment = getPaymentBadge(order);
  const fulfillment = getFulfillmentBadge(order);

  return (
    <div className="-mx-4 space-y-4 px-4 sm:-mx-0 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={backHref(from)}
          className="text-sm text-gray-500 hover:text-brand-green hover:underline"
        >
          ← {backLabel(from)}
        </Link>
        <OrderDetailNav
          newerId={adjacent.newerId}
          olderId={adjacent.olderId}
          fromQuery={fromQuery}
        />
      </div>

      <header className="flex flex-col gap-4 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {formatOrderNumber(sequence)}
            </h1>
            <OrderBadge label={payment.label} variant={payment.variant} />
            <OrderBadge
              label={fulfillment.label}
              variant={fulfillment.variant}
            />
            {isManualOrder(order.stripeSessionId) && (
              <span className="text-xs text-gray-500">Manual</span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {formatOrderDate(order.createdAt)} from{" "}
            {orderSourceLabel(order.stripeSessionId)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/settings/products/create"
            className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            Create product
          </Link>
          <OrderActions
            orderId={order.id}
            status={order.status}
            notes={order.notes ?? ""}
            stripeSessionId={order.stripeSessionId}
            hasLabel={Boolean(order.labelUrl)}
            invoiceHostedUrl={order.invoiceHostedUrl}
            invoiceSentAt={order.invoiceSentAt?.toISOString() ?? null}
            variant="toolbar"
          />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
        <div className="space-y-4">
          <OrderFulfillmentCard
            order={order}
            showShipping={shouldShowShippingPanel(order)}
            hasShipTo={orderHasShipToAddress(order)}
            shippoConfigured={shippoConfigured}
            shippoConfigMissing={shippoConfigMissing}
            packages={packages}
            defaultPackageId={defaultPackageId}
          />
          <OrderPaymentCard order={order} />
        </div>

        <OrderCustomerSidebar
          order={order}
          customer={order.customer}
          customerOrderCount={customerOrderCount}
        />
      </div>
    </div>
  );
}
