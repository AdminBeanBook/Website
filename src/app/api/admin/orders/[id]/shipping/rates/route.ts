import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { fetchRatesForOrder } from "@/lib/shipping/orders";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let packageId: string | undefined;
  try {
    const body = (await request.json()) as { packageId?: string };
    packageId = body.packageId;
  } catch {
    packageId = undefined;
  }

  try {
    const result = await fetchRatesForOrder(id, packageId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get rates";
    const status = message === "Order not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
