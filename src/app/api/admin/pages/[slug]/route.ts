import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { deletePage } from "@/lib/pages";

type RouteContext = { params: Promise<{ slug: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await context.params;

  try {
    await deletePage(slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete page";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
