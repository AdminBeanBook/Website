import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  pageHasUnpublishedChanges,
  publishAllPages,
  publishPage,
} from "@/lib/pages";
import { publishSiteConfig } from "@/lib/site-config";

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { slug?: string };
  const slug = body.slug;

  try {
    if (slug) {
      const page = await publishPage(slug);
      await publishSiteConfig();
      revalidatePath("/", "layout");
      return NextResponse.json({
        published: 1,
        page: {
          ...page,
          hasUnpublishedChanges: pageHasUnpublishedChanges(page),
        },
      });
    }

    const count = await publishAllPages();
    await publishSiteConfig();
    revalidatePath("/", "layout");
    return NextResponse.json({ published: count });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
