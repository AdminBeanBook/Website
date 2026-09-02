import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  prepareStripeInvoiceForOrder,
  sendPreparedStripeInvoice,
} from "@/lib/orders/invoice";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let action: string = "preview";
  try {
    const body = (await request.json()) as { action?: string };
    if (body.action === "send") action = "send";
  } catch {
    action = "preview";
  }

  try {
    if (action === "send") {
      const result = await sendPreparedStripeInvoice(id);
      return NextResponse.json(result);
    }
    const result = await prepareStripeInvoiceForOrder(id);
    return NextResponse.json({ preview: result.preview });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to prepare invoice";
    const status = message === "Order not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
