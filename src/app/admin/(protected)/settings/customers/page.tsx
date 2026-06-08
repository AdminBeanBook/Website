import { CustomersManager } from "@/components/admin/CustomersManager";
import { serializeCustomer } from "@/lib/customers/serialize";
import { prisma } from "@/lib/db";

export default async function AdminCustomersPage() {
  const [customers, tags] = await Promise.all([
    prisma.customer.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        tags: { orderBy: { name: "asc" } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.contactTag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <CustomersManager
      initialCustomers={customers.map((customer) => serializeCustomer(customer))}
      initialTags={tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
      }))}
    />
  );
}
