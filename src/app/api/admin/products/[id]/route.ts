import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getAdminProductById, updateProduct } from "@/lib/products/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const product = await getAdminProductById(id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    description?: string;
    priceCents?: number;
    imageUrl?: string;
    active?: boolean;
  };

  const data: Parameters<typeof updateProduct>[1] = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
  if (body.active !== undefined) data.active = body.active;
  if (body.priceCents !== undefined) {
    const priceCents = Math.round(Number(body.priceCents));
    if (!Number.isFinite(priceCents) || priceCents < 50) {
      return NextResponse.json(
        { error: "Price must be at least $0.50" },
        { status: 400 },
      );
    }
    data.priceCents = priceCents;
  }

  try {
    const product = await updateProduct(id, data);
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
