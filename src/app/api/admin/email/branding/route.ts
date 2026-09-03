import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  getSiteConfig,
  publishSiteConfig,
  saveSiteConfigDraft,
} from "@/lib/site-config";
import type { EmailBranding } from "@/lib/site-config/types";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const site = await getSiteConfig("published");
  return NextResponse.json({ emailBranding: site.emailBranding });
}

export async function PUT(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { emailBranding?: EmailBranding };
  if (!body.emailBranding) {
    return NextResponse.json(
      { error: "emailBranding is required" },
      { status: 400 },
    );
  }

  const site = await getSiteConfig("published");
  const updated = { ...site, emailBranding: body.emailBranding };

  await saveSiteConfigDraft(updated);
  await publishSiteConfig();

  return NextResponse.json({ emailBranding: body.emailBranding });
}
