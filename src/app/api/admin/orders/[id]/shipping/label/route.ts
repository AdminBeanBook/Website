import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { buyLabelForOrder } from "@/lib/shipping/orders";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let rateObjectId: string;
  let provider: string | undefined;
  let service: string | undefined;
  try {
    const body = (await request.json()) as {
      rateObjectId?: string;
      provider?: string;
      service?: string;
    };
    rateObjectId = body.rateObjectId ?? "";
    provider = body.provider;
    service = body.service;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const result = await buyLabelForOrder(id, rateObjectId, {
      provider,
      service,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to purchase label";
    const status = message === "Order not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
