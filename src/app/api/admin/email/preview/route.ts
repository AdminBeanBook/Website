import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { wrapEmailHtml } from "@/lib/email/templates";
import { getSiteConfig } from "@/lib/site-config";

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { htmlBody?: string };
  const colors = (await getSiteConfig("published")).colors;
  const html = wrapEmailHtml(body.htmlBody ?? "", colors);

  return NextResponse.json({ html });
}
