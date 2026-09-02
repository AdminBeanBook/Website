import type { Order } from "@prisma/client";
import { BEAN_BOOK_2026 } from "@/lib/products";
import { getShipFromAddress } from "@/lib/shipping/config";
import {
  isComplimentaryOrder,
  isManualOrder,
  isUnfulfilled,
  isUnpaid,
  normalizeOrderStatus,
} from "@/lib/orders/status";

export function formatOrderNumber(sequence: number): string {
  return `#${sequence}`;
}

export function getLineItemQuantity(
  order: Pick<Order, "amountCents"> & { discountCents?: number | null },
): number {
  const unit = BEAN_BOOK_2026.priceCents;
  if (unit <= 0) return 1;
  const basis =
    order.amountCents > 0 ? order.amountCents : (order.discountCents ?? 0);
  if (basis <= 0) return 1;
  if (basis % unit === 0) {
    const q = basis / unit;
    return q >= 1 ? q : 1;
  }
  return Math.max(1, Math.round(basis / unit));
}

export type BadgeVariant = "success" | "warning" | "neutral" | "info";

export function getFulfillmentBadge(
  order: Pick<Order, "status" | "labelUrl" | "shippedAt">,
): { label: string; variant: BadgeVariant } {
  if (normalizeOrderStatus(order.status) === "refunded") {
    return { label: "Canceled", variant: "neutral" };
  }
  if (order.labelUrl || order.shippedAt) {
    return { label: "Fulfilled", variant: "success" };
  }
  if (isUnfulfilled(order) || isUnpaid(order.status)) {
    return { label: "Unfulfilled", variant: "warning" };
  }
  if (normalizeOrderStatus(order.status) === "archived") {
    return { label: "Fulfilled", variant: "success" };
  }
  return { label: "Unfulfilled", variant: "warning" };
}

export function getPaymentBadge(
  order: Pick<Order, "status" | "stripeSessionId">,
): { label: string; variant: BadgeVariant } {
  if (isComplimentaryOrder(order.stripeSessionId)) {
    return { label: "Complimentary", variant: "info" };
  }
  if (isUnpaid(order.status)) {
    return { label: "Unpaid", variant: "warning" };
  }
  const s = normalizeOrderStatus(order.status);
  if (s === "refunded") return { label: "Refunded", variant: "neutral" };
  return { label: "Paid", variant: "success" };
}

export function orderSourceLabel(stripeSessionId: string): string {
  if (isComplimentaryOrder(stripeSessionId)) return "Complimentary order";
  return isManualOrder(stripeSessionId) ? "Manual order" : "Online Store";
}

export function formatOrderDate(date: Date): string {
  return date.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getShipFromLocationLabel(): string | null {
  try {
    const from = getShipFromAddress();
    const city = from.city?.trim();
    if (city) return city;
    return from.name?.trim() || null;
  } catch {
    return null;
  }
}

export type OrderAmountBreakdown = {
  quantity: number;
  subtotalCents: number;
  discountCents: number;
  shippingAndFeesCents: number;
  totalCents: number;
};

export function getOrderAmountBreakdown(
  order: Pick<Order, "amountCents" | "discountCents">,
): OrderAmountBreakdown {
  const quantity = getLineItemQuantity(order);
  const subtotalCents = BEAN_BOOK_2026.priceCents * quantity;
  const discountCents = order.discountCents ?? 0;
  const afterDiscount = Math.max(0, subtotalCents - discountCents);
  const shippingAndFeesCents = Math.max(0, order.amountCents - afterDiscount);

  return {
    quantity,
    subtotalCents,
    discountCents,
    shippingAndFeesCents,
    totalCents: order.amountCents,
  };
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
