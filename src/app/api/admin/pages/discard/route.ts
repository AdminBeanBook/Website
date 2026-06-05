import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { discardPageDraft, pageHasUnpublishedChanges } from "@/lib/pages";
import { discardSiteConfigDraft } from "@/lib/site-config";

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { slug?: string };
  if (!body.slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  try {
    const [page] = await Promise.all([
      discardPageDraft(body.slug),
      discardSiteConfigDraft(),
    ]);
    return NextResponse.json({
      page: {
        ...page,
        hasUnpublishedChanges: pageHasUnpublishedChanges(page),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Discard failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
