import { NextResponse } from "next/server";
import { requirePartnerSession } from "@/lib/partner-auth";
import { partnerCanEditShop } from "@/lib/app-shops";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const partner = await requirePartnerSession();
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const deal = await prisma.appDeal.findUnique({ where: { id } });
  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  const allowed = await partnerCanEditShop(partner.id, partner.role, deal.shopId);
  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.appDeal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
