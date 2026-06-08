import { CustomerDetail } from "@/components/admin/CustomerDetail";
import { serializeCustomer } from "@/lib/customers/serialize";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  const [customer, tags] = await Promise.all([
    prisma.customer.findUnique({
      where: { id },
      include: {
        tags: { orderBy: { name: "asc" } },
        orders: { orderBy: { createdAt: "desc" } },
        _count: { select: { orders: true } },
      },
    }),
    prisma.contactTag.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!customer) notFound();

  return (
    <CustomerDetail
      customer={serializeCustomer(customer, { includeOrders: true })}
      allTags={tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
      }))}
    />
  );
}
