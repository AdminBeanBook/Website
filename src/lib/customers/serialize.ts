import type { ContactTag, Customer, Order } from "@prisma/client";
import type { CustomerRow } from "@/lib/customers/types";

type CustomerWithRelations = Customer & {
  tags?: ContactTag[];
  orders?: Order[];
  _count?: { orders: number };
};

export function serializeCustomer(
  customer: CustomerWithRelations,
  options?: { includeOrders?: boolean },
): CustomerRow {
  return {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    phone: customer.phone,
    notes: customer.notes,
    tags: (customer.tags ?? []).map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
    })),
    orderCount: customer._count?.orders ?? customer.orders?.length ?? 0,
    orders: options?.includeOrders
      ? (customer.orders ?? []).map((order) => ({
          id: order.id,
          createdAt: order.createdAt.toISOString(),
          amountCents: order.amountCents,
          status: order.status,
        }))
      : undefined,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}
