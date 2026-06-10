import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { syncDiscountToStripe } from "@/lib/stripe-discounts";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  const synced = await Promise.all(
    codes.map((code) =>
      code.stripePromotionCodeId ? code : syncDiscountToStripe(code),
    ),
  );

  return NextResponse.json(synced);
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    code?: string;
    type?: string;
    value?: number;
    maxUses?: number | null;
    expiresAt?: string | null;
    active?: boolean;
  };

  if (!body.code || !body.type || body.value == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const code = body.code.trim().toUpperCase();
  if (!["PERCENT", "FIXED"].includes(body.type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const record = await prisma.discountCode.create({
    data: {
      code,
      type: body.type,
      value: body.value,
      maxUses: body.maxUses ?? null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      active: body.active ?? true,
    },
  });

  const synced = await syncDiscountToStripe(record);
  return NextResponse.json(synced);
}
