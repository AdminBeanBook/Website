import { prisma } from "@/lib/db";
import type { AppShop } from "@prisma/client";

export function getShopBrandDisplayName(name: string): string {
  return name
    .replace(/\s*[-–—|]\s*.+$/u, "")
    .replace(/[-–—]\s*.+$/u, "")
    .trim();
}

export function getShopBrandKey(name: string): string {
  return getShopBrandDisplayName(name).toLowerCase();
}

export type AppShopBrandGroup = {
  key: string;
  displayName: string;
  locations: AppShop[];
  primary: AppShop;
};

export function groupAppShopsByBrand(shops: AppShop[]): AppShopBrandGroup[] {
  const byKey = new Map<string, AppShop[]>();
  for (const shop of shops) {
    const key = getShopBrandKey(shop.name);
    const list = byKey.get(key) ?? [];
    list.push(shop);
    byKey.set(key, list);
  }

  return [...byKey.entries()]
    .map(([key, locations]) => {
      const sorted = [...locations].sort((a, b) => a.name.localeCompare(b.name));
      const primary = sorted[0];
      return {
        key,
        displayName: getShopBrandDisplayName(primary.name),
        locations: sorted,
        primary,
      };
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function listEditableAppShops(options: {
  partnerId: string;
  role: string;
}) {
  if (options.role === "shop_super_admin") {
    return prisma.appShop.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  }

  const access = await prisma.shopPartnerAccess.findMany({
    where: { partnerId: options.partnerId },
    include: { shop: true },
  });

  return access
    .map((row) => row.shop)
    .filter((shop) => shop.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function partnerCanEditShop(
  partnerId: string,
  role: string,
  shopId: string,
) {
  if (role === "shop_super_admin") return true;
  const row = await prisma.shopPartnerAccess.findUnique({
    where: { partnerId_shopId: { partnerId, shopId } },
  });
  return Boolean(row);
}

export async function updateBrandShopContent(
  shopIds: string[],
  data: {
    description?: string;
    logoUrl?: string | null;
  },
) {
  await prisma.appShop.updateMany({
    where: { id: { in: shopIds } },
    data: {
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.logoUrl !== undefined ? { logoUrl: data.logoUrl } : {}),
    },
  });
}

export async function listDealsForShops(shopIds: string[]) {
  if (shopIds.length === 0) return [];
  return prisma.appDeal.findMany({
    where: { shopId: { in: shopIds } },
    orderBy: [{ startsAt: "desc" }, { expiresAt: "desc" }],
  });
}
