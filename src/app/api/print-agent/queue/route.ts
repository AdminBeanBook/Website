import { NextResponse } from "next/server";
import { authorizePrintAgent } from "@/lib/print-agent/auth";
import { listUnprintedLabels } from "@/lib/print-agent/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mac print agent polls this for labels that need printing. */
export async function GET(request: Request) {
  if (!authorizePrintAgent(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const items = await listUnprintedLabels(limit);

  return NextResponse.json({ items, count: items.length });
}
