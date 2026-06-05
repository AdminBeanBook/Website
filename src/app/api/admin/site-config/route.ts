import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  DEFAULT_SITE_CONFIG,
  ensureSiteSettings,
  getSiteConfig,
  publishSiteConfig,
  saveSiteConfigDraft,
  siteConfigHasUnpublishedChanges,
} from "@/lib/site-config";
import type { SiteConfig } from "@/lib/site-config/types";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureSiteSettings();
  const published = await getSiteConfig("published");
  const draft = await getSiteConfig("draft");

  return NextResponse.json({
    published,
    draft,
    hasUnpublishedChanges: siteConfigHasUnpublishedChanges(published, draft),
  });
}

export async function PUT(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SiteConfig;
  if (!body?.site?.name || !body?.colors || !body?.images) {
    return NextResponse.json({ error: "Invalid site config" }, { status: 400 });
  }

  const merged: SiteConfig = {
    ...DEFAULT_SITE_CONFIG,
    ...body,
    site: { ...DEFAULT_SITE_CONFIG.site, ...body.site },
    colors: { ...DEFAULT_SITE_CONFIG.colors, ...body.colors },
    images: {
      ...DEFAULT_SITE_CONFIG.images,
      ...body.images,
      gallery: body.images.gallery ?? [],
    },
    nav: body.nav ?? DEFAULT_SITE_CONFIG.nav,
    buttons: body.buttons ?? DEFAULT_SITE_CONFIG.buttons,
  };

  await saveSiteConfigDraft(merged);
  const published = await getSiteConfig("published");
  const draft = await getSiteConfig("draft");

  return NextResponse.json({
    draft,
    hasUnpublishedChanges: siteConfigHasUnpublishedChanges(published, draft),
  });
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
  };

  if (body.action === "publish") {
    await publishSiteConfig();
    const published = await getSiteConfig("published");
    return NextResponse.json({ published, hasUnpublishedChanges: false });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
