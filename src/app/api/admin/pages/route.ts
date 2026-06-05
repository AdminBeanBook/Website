import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getAllPagesForAdmin,
  pageHasUnpublishedChanges,
  savePageDraft,
} from "@/lib/pages";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pages = await getAllPagesForAdmin();
  return NextResponse.json(
    pages.map((page) => ({
      ...page,
      hasUnpublishedChanges: pageHasUnpublishedChanges(page),
    })),
  );
}

/** Save draft (sandbox) only — does not affect the live site. */
export async function PUT(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    slug?: string;
    title?: string;
    subtitle?: string | null;
    body?: string;
    placedImages?: { id: string; url: string; x: number; y: number; width?: number; alt?: string }[];
    path?: string;
    template?: string;
    enabled?: boolean;
    showInNav?: boolean;
    textColors?: Record<string, string>;
  };

  if (!body.slug || !body.title) {
    return NextResponse.json({ error: "Slug and title required" }, { status: 400 });
  }

  try {
    const page = await savePageDraft({
      slug: body.slug,
      title: body.title,
      subtitle: body.subtitle ?? null,
      body: body.body ?? "",
      placedImages: body.placedImages,
      path: body.path,
      template: body.template,
      enabled: body.enabled,
      showInNav: body.showInNav,
      textColors: body.textColors,
    });
    return NextResponse.json({
      ...page,
      hasUnpublishedChanges: pageHasUnpublishedChanges(page),
    });
  } catch {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }
}
