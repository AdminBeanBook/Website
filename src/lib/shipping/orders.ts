import { prisma } from "@/lib/db";
import {
  formatParcelSummary,
  resolveParcelForOrder,
} from "@/lib/shipping/packages";
import { createShipmentForOrder, purchaseLabel } from "@/lib/shipping/shippo";
import type { Order } from "@prisma/client";

export function orderHasShipToAddress(order: Order): boolean {
  return Boolean(
    order.shippingLine1 &&
      order.shippingCity &&
      order.shippingState &&
      order.shippingPostal,
  );
}

export async function fetchRatesForOrder(
  orderId: string,
  packageId?: string | null,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }
  if (!orderHasShipToAddress(order)) {
    throw new Error("Order is missing a complete shipping address");
  }
  if (order.labelUrl) {
    throw new Error("This order already has a shipping label");
  }

  const parcel = await resolveParcelForOrder(packageId);
  const { shipmentId, rates } = await createShipmentForOrder(order, parcel);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      shippoShipmentId: shipmentId,
      packagePresetId: parcel.id ?? null,
    },
  });

  return {
    shipmentId,
    rates,
    parcel: {
      id: parcel.id ?? null,
      summary: formatParcelSummary(parcel),
    },
  };
}

export async function buyLabelForOrder(
  orderId: string,
  rateObjectId: string,
  rateMeta?: { provider?: string; service?: string },
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.labelUrl) {
    throw new Error("This order already has a shipping label");
  }
  if (!rateObjectId) {
    throw new Error("Rate is required");
  }

  const label = await purchaseLabel(rateObjectId, orderId);

  const trackingNote = label.trackingNumber
    ? `Tracking: ${label.trackingNumber}`
    : null;
  const notes = trackingNote
    ? order.notes
      ? `${order.notes}\n${trackingNote}`
      : trackingNote
    : order.notes;

  const stayUnpaid = order.status === "unpaid";

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      shippoTransactionId: label.transactionId,
      trackingNumber: label.trackingNumber,
      labelUrl: label.labelUrl,
      carrier: label.carrier ?? rateMeta?.provider ?? null,
      carrierService: rateMeta?.service ?? null,
      labelCostCents: label.labelCostCents,
      status: stayUnpaid ? "unpaid" : "archived",
      shippedAt: new Date(),
      notes,
    },
  });

  return { order: updated, label };
}
