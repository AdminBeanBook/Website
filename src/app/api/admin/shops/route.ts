import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  locationsToJson,
  parseLocationsText,
  type LocationLabel,
} from "@/lib/coffee-shops";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shops = await prisma.coffeeShop.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(shops);
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    website?: string;
    locationLabel?: LocationLabel;
    locationsText?: string;
    sortOrder?: number;
    active?: boolean;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const locations = parseLocationsText(body.locationsText ?? "");
  if (locations.length === 0) {
    return NextResponse.json(
      { error: "Add at least one location (one per line)" },
      { status: 400 },
    );
  }

  const shop = await prisma.coffeeShop.create({
    data: {
      name,
      website: body.website?.trim() || "",
      locationLabel:
        body.locationLabel === "Locations" ? "Locations" : "Location",
      locationsJson: locationsToJson(locations),
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      active: body.active !== false,
    },
  });

  return NextResponse.json(shop, { status: 201 });
}
