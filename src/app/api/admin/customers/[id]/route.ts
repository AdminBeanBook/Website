import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { serializeCustomer } from "@/lib/customers/serialize";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      tags: { orderBy: { name: "asc" } },
      orders: { orderBy: { createdAt: "desc" } },
      _count: { select: { orders: true } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json(
    serializeCustomer(customer, { includeOrders: true }),
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string | null;
    phone?: string | null;
    notes?: string | null;
    tagIds?: string[];
  };

  const data: {
    name?: string | null;
    phone?: string | null;
    notes?: string | null;
    tags?: { set: { id: string }[] };
  } = {};

  if (body.name !== undefined) data.name = body.name?.trim() || null;
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
  if (body.tagIds !== undefined) {
    data.tags = { set: body.tagIds.map((tagId) => ({ id: tagId })) };
  }

  try {
    const customer = await prisma.customer.update({
      where: { id },
      data,
      include: {
        tags: { orderBy: { name: "asc" } },
        orders: { orderBy: { createdAt: "desc" } },
        _count: { select: { orders: true } },
      },
    });
    return NextResponse.json(
      serializeCustomer(customer, { includeOrders: true }),
    );
  } catch {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
}
