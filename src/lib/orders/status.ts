import type { Order } from "@prisma/client";

export const ORDER_TABS = [
  "all",
  "unfulfilled",
  "unpaid",
  "archived",
  "create",
] as const;
export type OrderTab = (typeof ORDER_TABS)[number];

export const ORDER_STATUSES = ["unpaid", "paid", "archived", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Legacy Stripe flow used "shipped"; treat as archived. */
export function normalizeOrderStatus(status: string): OrderStatus | string {
  if (status === "shipped") return "archived";
  return status;
}

export function isUnpaid(status: string): boolean {
  return normalizeOrderStatus(status) === "unpaid";
}

export function isUnfulfilled(
  order: Pick<Order, "status" | "labelUrl">,
): boolean {
  return (
    normalizeOrderStatus(order.status) === "paid" && !order.labelUrl
  );
}

/** Paid or unpaid orders that still need a label (or show label details). */
export function shouldShowShippingPanel(
  order: Pick<Order, "status" | "labelUrl">,
): boolean {
  if (order.status === "refunded") return false;
  if (order.labelUrl) return true;
  const s = normalizeOrderStatus(order.status);
  return s === "paid" || s === "unpaid";
}

export function isArchived(status: string): boolean {
  const s = normalizeOrderStatus(status);
  return s === "archived";
}

export function orderMatchesTab(
  order: Pick<Order, "status" | "labelUrl">,
  tab: OrderTab,
): boolean {
  switch (tab) {
    case "all":
      return true;
    case "unpaid":
      return isUnpaid(order.status);
    case "unfulfilled":
      return isUnfulfilled(order);
    case "archived":
      return isArchived(order.status);
    case "create":
      return false;
    default:
      return true;
  }
}

export function isCreateTab(tab: OrderTab): boolean {
  return tab === "create";
}

export function parseOrderTab(value: string | undefined): OrderTab {
  if (value && ORDER_TABS.includes(value as OrderTab)) {
    return value as OrderTab;
  }
  return "all";
}

export function tabLabel(tab: OrderTab): string {
  switch (tab) {
    case "all":
      return "All";
    case "unfulfilled":
      return "Unfulfilled";
    case "unpaid":
      return "Unpaid";
    case "archived":
      return "Archived";
    case "create":
      return "Create order";
  }
}

export function statusLabel(status: string): string {
  const s = normalizeOrderStatus(status);
  switch (s) {
    case "unpaid":
      return "Unpaid";
    case "paid":
      return "Paid";
    case "archived":
      return "Archived";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

export function isManualOrder(stripeSessionId: string): boolean {
  return stripeSessionId.startsWith("manual_");
}
