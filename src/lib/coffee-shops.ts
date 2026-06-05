import { prisma } from "@/lib/db";

export type LocationLabel = "Location" | "Locations";

export type CoffeeShopRow = {
  id: string;
  name: string;
  website: string;
  locationLabel: LocationLabel;
  locations: string[];
  sortOrder: number;
  active: boolean;
};

export function parseLocationsJson(json: string): string[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((line) => (typeof line === "string" ? line.trim() : ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function locationsToJson(lines: string[]): string {
  return JSON.stringify(
    lines.map((l) => l.trim()).filter(Boolean),
  );
}

export function parseLocationsText(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function toRow(shop: {
  id: string;
  name: string;
  website: string;
  locationLabel: string;
  locationsJson: string;
  sortOrder: number;
  active: boolean;
}): CoffeeShopRow {
  const label: LocationLabel =
    shop.locationLabel === "Locations" ? "Locations" : "Location";
  return {
    id: shop.id,
    name: shop.name,
    website: shop.website,
    locationLabel: label,
    locations: parseLocationsJson(shop.locationsJson),
    sortOrder: shop.sortOrder,
    active: shop.active,
  };
}

export function compareCoffeeShopNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export async function listCoffeeShops(options?: {
  activeOnly?: boolean;
}): Promise<CoffeeShopRow[]> {
  const shops = await prisma.coffeeShop.findMany({
    where: options?.activeOnly ? { active: true } : undefined,
    orderBy: { name: "asc" },
  });
  return shops.map(toRow);
}
