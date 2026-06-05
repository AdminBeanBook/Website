import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await prisma.customer.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      orders: { orderBy: { createdAt: "desc" }, take: 5 },
      _count: { select: { orders: true } },
    },
  });

  return NextResponse.json(customers);
}
