import { NextResponse } from "next/server";
import { authorizePrintAgent } from "@/lib/print-agent/auth";
import { markLabelPrinted } from "@/lib/print-agent/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ orderId: string }> };

/** Mac print agent marks a label as printed after a successful print. */
export async function POST(request: Request, context: RouteContext) {
  if (!authorizePrintAgent(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order id" }, { status: 400 });
  }

  try {
    const order = await markLabelPrinted(orderId);
    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to mark printed";
    const status = message === "Order not found" ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
