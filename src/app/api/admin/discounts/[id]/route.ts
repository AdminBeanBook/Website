import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  deactivateStripePromotion,
  syncDiscountToStripe,
} from "@/lib/stripe-discounts";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    active?: boolean;
    maxUses?: number | null;
    expiresAt?: string | null;
  };

  const record = await prisma.discountCode.update({
    where: { id },
    data: {
      active: body.active,
      maxUses: body.maxUses,
      expiresAt:
        body.expiresAt === null
          ? null
          : body.expiresAt
            ? new Date(body.expiresAt)
            : undefined,
    },
  });

  const synced = await syncDiscountToStripe(record);
  return NextResponse.json(synced);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const record = await prisma.discountCode.findUnique({ where: { id } });
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deactivateStripePromotion(record.stripePromotionCodeId);
  await prisma.discountCode.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
