import Image from "next/image";
import type { Order } from "@prisma/client";
import { OrderBadge } from "@/components/admin/order-detail/OrderBadge";
import { OrderShippingPanel } from "@/components/admin/OrderShippingPanel";
import type { PackagePresetRow } from "@/components/admin/PackageManager";
import {
  formatMoney,
  getFulfillmentBadge,
  getLineItemQuantity,
  getShipFromLocationLabel,
} from "@/lib/orders/display";
import { BEAN_BOOK_2026 } from "@/lib/products";

type OrderFulfillmentCardProps = {
  order: Pick<
    Order,
    | "id"
    | "status"
    | "amountCents"
    | "labelUrl"
    | "shippedAt"
    | "carrier"
    | "carrierService"
    | "trackingNumber"
    | "shippoShipmentId"
    | "labelCostCents"
  > & {
    packagePreset?: { name: string } | null;
  };
  showShipping: boolean;
  hasShipTo: boolean;
  shippoConfigured: boolean;
  shippoConfigMissing: string[];
  packages: PackagePresetRow[];
  defaultPackageId: string | null;
};

export function OrderFulfillmentCard({
  order,
  showShipping,
  hasShipTo,
  shippoConfigured,
  shippoConfigMissing,
  packages,
  defaultPackageId,
}: OrderFulfillmentCardProps) {
  const fulfillment = getFulfillmentBadge(order);
  const quantity = getLineItemQuantity(order);
  const unitPrice = BEAN_BOOK_2026.priceCents;
  const lineTotal = unitPrice * quantity;
  const shipFrom = getShipFromLocationLabel();
  const shippingMethod =
    order.carrier && order.carrierService
      ? `${order.carrier.toUpperCase()} — ${order.carrierService}`
      : order.labelUrl
        ? "Label purchased"
        : "Standard shipping";

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3">
        <OrderBadge label={fulfillment.label} variant={fulfillment.variant} />
        {shipFrom && (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
            {shipFrom}
          </span>
        )}
      </div>

      <div className="border-b border-gray-100 px-5 py-3 text-sm text-gray-600">
        <p className="font-medium text-gray-800">{shippingMethod}</p>
        {order.trackingNumber && (
          <p className="mt-0.5 font-mono text-xs text-gray-500">
            Tracking: {order.trackingNumber}
          </p>
        )}
      </div>

      <div className="flex gap-4 border-b border-gray-100 px-5 py-4">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50">
          <Image
            src={BEAN_BOOK_2026.imageUrl}
            alt={BEAN_BOOK_2026.name}
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900">{BEAN_BOOK_2026.name}</p>
          <p className="mt-0.5 text-sm text-gray-500">
            {formatMoney(unitPrice)} × {quantity}
          </p>
        </div>
        <p className="shrink-0 text-sm font-medium tabular-nums text-gray-900">
          {formatMoney(lineTotal)}
        </p>
      </div>

      {showShipping && (
        <div className="px-5 py-4">
          <OrderShippingPanel
            orderId={order.id}
            hasShipTo={hasShipTo}
            paymentPending={order.status === "unpaid"}
            shippoConfigured={shippoConfigured}
            shippoConfigMissing={shippoConfigMissing}
            packages={packages}
            defaultPackageId={defaultPackageId}
            packagePresetName={order.packagePreset?.name ?? null}
            shippoShipmentId={order.shippoShipmentId}
            labelUrl={order.labelUrl}
            trackingNumber={order.trackingNumber}
            carrier={order.carrier}
            carrierService={order.carrierService}
            labelCostCents={order.labelCostCents}
            shippedAt={order.shippedAt?.toISOString() ?? null}
            embedded
          />
        </div>
      )}
    </section>
  );
}
