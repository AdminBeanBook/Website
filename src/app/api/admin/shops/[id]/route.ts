import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  locationsToJson,
  parseLocationsText,
  type LocationLabel,
} from "@/lib/coffee-shops";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    website?: string;
    locationLabel?: LocationLabel;
    locationsText?: string;
    sortOrder?: number;
    active?: boolean;
  };

  const data: {
    name?: string;
    website?: string;
    locationLabel?: string;
    locationsJson?: string;
    sortOrder?: number;
    active?: boolean;
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.website !== undefined) data.website = body.website.trim();
  if (body.locationLabel !== undefined) {
    data.locationLabel =
      body.locationLabel === "Locations" ? "Locations" : "Location";
  }
  if (body.locationsText !== undefined) {
    const locations = parseLocationsText(body.locationsText);
    if (locations.length === 0) {
      return NextResponse.json(
        { error: "Add at least one location" },
        { status: 400 },
      );
    }
    data.locationsJson = locationsToJson(locations);
  }
  if (body.sortOrder !== undefined) data.sortOrder = body.sortOrder;
  if (body.active !== undefined) data.active = body.active;

  try {
    const shop = await prisma.coffeeShop.update({
      where: { id },
      data,
    });
    return NextResponse.json(shop);
  } catch {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await prisma.coffeeShop.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Shop not found" }, { status: 404 });
  }
}
