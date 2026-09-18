import { prisma } from "@/lib/db";
import { BEAN_BOOK_2027 } from "@/lib/products/catalog";

export type PrintQueueItem = {
  orderId: string;
  customerName: string | null;
  customerEmail: string;
  productId: string | null;
  labelUrl: string;
  trackingNumber: string | null;
  carrier: string | null;
  createdAt: string;
  shippedAt: string | null;
};

/**
 * Labels ready to print on the Mac agent.
 * Skips 2027 pre-orders until fulfillment is intentional.
 */
export async function listUnprintedLabels(
  limit = 20,
): Promise<PrintQueueItem[]> {
  const excludeProductIds = [BEAN_BOOK_2027.id];

  const orders = await prisma.order.findMany({
    where: {
      labelUrl: { not: null },
      labelPrintedAt: null,
      NOT: {
        OR: [
          { productId: { in: excludeProductIds } },
          { labelUrl: "imported" },
        ],
      },
    },
    orderBy: { shippedAt: "asc" },
    take: Math.min(50, Math.max(1, limit)),
    select: {
      id: true,
      customerName: true,
      customerEmail: true,
      productId: true,
      labelUrl: true,
      trackingNumber: true,
      carrier: true,
      createdAt: true,
      shippedAt: true,
    },
  });

  return orders
    .filter((o): o is typeof o & { labelUrl: string } => Boolean(o.labelUrl))
    .map((o) => ({
      orderId: o.id,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      productId: o.productId,
      labelUrl: o.labelUrl,
      trackingNumber: o.trackingNumber,
      carrier: o.carrier,
      createdAt: o.createdAt.toISOString(),
      shippedAt: o.shippedAt?.toISOString() ?? null,
    }));
}

export async function markLabelPrinted(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      labelUrl: true,
      labelPrintedAt: true,
    },
  });
  if (!order) {
    throw new Error("Order not found");
  }
  if (!order.labelUrl || order.labelUrl === "imported") {
    throw new Error("Order has no printable label");
  }
  if (order.labelPrintedAt) {
    return order;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: { labelPrintedAt: new Date() },
    select: {
      id: true,
      labelPrintedAt: true,
    },
  });
}
