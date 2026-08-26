import { NextResponse } from "next/server";
import {
  isPartnerSuperAdmin,
  requirePartnerSession,
} from "@/lib/partner-auth";
import {
  groupAppShopsByBrand,
  listEditableAppShops,
  partnerCanEditShop,
  updateBrandShopContent,
} from "@/lib/app-shops";

export async function GET() {
  const partner = await requirePartnerSession();
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shops = await listEditableAppShops({
    partnerId: partner.id,
    role: partner.role,
  });

  return NextResponse.json({
    brands: groupAppShopsByBrand(shops).map((brand) => ({
      key: brand.key,
      displayName: brand.displayName,
      locationCount: brand.locations.length,
      primary: {
        id: brand.primary.id,
        name: brand.primary.name,
        description: brand.primary.description,
        logoUrl: brand.primary.logoUrl,
      },
      shopIds: brand.locations.map((shop) => shop.id),
    })),
    superAdmin: isPartnerSuperAdmin(partner.role),
  });
}

export async function PATCH(request: Request) {
  const partner = await requirePartnerSession();
  if (!partner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    shopIds?: string[];
    description?: string;
    logoUrl?: string | null;
  };

  const shopIds = Array.isArray(body.shopIds) ? body.shopIds : [];
  if (shopIds.length === 0) {
    return NextResponse.json({ error: "shopIds required" }, { status: 400 });
  }

  for (const shopId of shopIds) {
    const allowed = await partnerCanEditShop(partner.id, partner.role, shopId);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await updateBrandShopContent(shopIds, {
    description: body.description,
    logoUrl: body.logoUrl,
  });

  return NextResponse.json({ ok: true });
}
