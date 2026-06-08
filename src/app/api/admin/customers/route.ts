import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { serializeCustomer } from "@/lib/customers/serialize";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase();
  const tagId = searchParams.get("tagId")?.trim();

  const customers = await prisma.customer.findMany({
    where: {
      ...(tagId ? { tags: { some: { id: tagId } } } : {}),
      ...(q
        ? {
            OR: [
              { email: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { phone: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      tags: { orderBy: { name: "asc" } },
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json(customers.map((customer) => serializeCustomer(customer)));
}
