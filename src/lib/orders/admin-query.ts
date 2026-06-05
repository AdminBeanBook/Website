import { prisma } from "@/lib/db";

export function getAdminOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: { customer: true, packagePreset: true },
  });
}

/** Sequential display number (1-based), stable by createdAt then id. */
export async function getOrderDisplaySequence(
  orderId: string,
  createdAt: Date,
): Promise<number> {
  const earlier = await prisma.order.count({
    where: {
      OR: [
        { createdAt: { lt: createdAt } },
        { createdAt, id: { lt: orderId } },
      ],
    },
  });
  return earlier + 1;
}

/** Neighbors in the orders list (newest first): newer = row above, older = row below. */
export async function getAdjacentOrderIds(
  createdAt: Date,
  orderId: string,
): Promise<{ newerId: string | null; olderId: string | null }> {
  const [newer, older] = await Promise.all([
    prisma.order.findFirst({
      where: {
        OR: [
          { createdAt: { gt: createdAt } },
          { createdAt, id: { gt: orderId } },
        ],
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true },
    }),
    prisma.order.findFirst({
      where: {
        OR: [
          { createdAt: { lt: createdAt } },
          { createdAt, id: { lt: orderId } },
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { id: true },
    }),
  ]);

  return { newerId: newer?.id ?? null, olderId: older?.id ?? null };
}

export async function getCustomerOrderCount(
  customerId: string | null | undefined,
  customerEmail: string,
): Promise<number> {
  if (customerId) {
    return prisma.order.count({ where: { customerId } });
  }
  return prisma.order.count({ where: { customerEmail } });
}
