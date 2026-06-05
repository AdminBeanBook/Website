import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createProduct, listAdminProducts } from "@/lib/products/admin";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await listAdminProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      id?: string;
      name?: string;
      description?: string;
      priceCents?: number;
      imageUrl?: string;
      active?: boolean;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!body.imageUrl?.trim()) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const priceCents = Math.round(Number(body.priceCents));
    if (!Number.isFinite(priceCents) || priceCents < 50) {
      return NextResponse.json(
        { error: "Price must be at least $0.50" },
        { status: 400 },
      );
    }

    const product = await createProduct({
      id: body.id,
      name: body.name,
      description: body.description,
      priceCents,
      imageUrl: body.imageUrl,
      active: body.active,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
