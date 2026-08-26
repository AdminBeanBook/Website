import { NextResponse } from "next/server";
import { requirePartnerSession } from "@/lib/partner-auth";
import {
  listDealsForShops,
  partnerCanEditShop,
} from "@/lib/app-shops";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const partner = await requirePartnerSession();
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const shopIds = (searchParams.get("shopIds") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (shopIds.length === 0) {
    return NextResponse.json({ error: "shopIds required" }, { status: 400 });
  }

  for (const shopId of shopIds) {
    const allowed = await partnerCanEditShop(partner.id, partner.role, shopId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const deals = await listDealsForShops(shopIds);
  return NextResponse.json({
    deals: deals.map((deal) => ({
      id: deal.id,
      shopId: deal.shopId,
      title: deal.title,
      body: deal.body,
      startsAt: deal.startsAt?.toISOString() ?? null,
      expiresAt: deal.expiresAt.toISOString(),
    })),
  });
}

export async function POST(request: Request) {
  const partner = await requirePartnerSession();
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    shopIds?: string[];
    title?: string;
    body?: string;
    startsAt?: string;
    expiresAt?: string;
  };

  const shopIds = Array.isArray(body.shopIds) ? body.shopIds : [];
  const title = body.title?.trim() ?? "";
  const dealBody = body.body?.trim() ?? "";
  const startsAt = body.startsAt ? new Date(body.startsAt) : null;
  const expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

  if (shopIds.length === 0) {
    return NextResponse.json({ error: "shopIds required" }, { status: 400 });
  }
  if (!title || !dealBody) {
    return NextResponse.json(
      { error: "Title and description required" },
      { status: 400 },
    );
  }
  if (!startsAt || Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "Valid start date/time required" }, { status: 400 });
  }
  if (!expiresAt || Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "Valid end date/time required" }, { status: 400 });
  }
  if (expiresAt <= startsAt) {
    return NextResponse.json(
      { error: "End must be after start" },
      { status: 400 },
    );
  }

  for (const shopId of shopIds) {
    const allowed = await partnerCanEditShop(partner.id, partner.role, shopId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  // One flash deal per brand location so it shows for every pin
  await prisma.appDeal.createMany({
    data: shopIds.map((shopId) => ({
      shopId,
      title,
      body: dealBody,
      startsAt,
      expiresAt,
    })),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const partner = await requirePartnerSession();
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    body?: string;
    startsAt?: string | null;
    expiresAt?: string;
    shopIds?: string[];
  };

  const shopIds = Array.isArray(body.shopIds) ? body.shopIds : [];
  if (shopIds.length === 0 || !body.title || !body.body || !body.expiresAt) {
    return NextResponse.json({ error: "Missing deal identity fields" }, { status: 400 });
  }

  for (const shopId of shopIds) {
    const allowed = await partnerCanEditShop(partner.id, partner.role, shopId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.appDeal.deleteMany({
    where: {
      shopId: { in: shopIds },
      title: body.title,
      body: body.body,
      expiresAt: new Date(body.expiresAt),
      ...(body.startsAt
        ? { startsAt: new Date(body.startsAt) }
        : { startsAt: null }),
    },
  });

  return NextResponse.json({ ok: true });
}
