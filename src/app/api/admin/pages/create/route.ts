import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { createPage } from "@/lib/pages";
import type { PageTemplate } from "@/lib/site-config/types";

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    slug?: string;
    template?: PageTemplate;
    showInNav?: boolean;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    const page = await createPage({
      title: body.title,
      slug: body.slug,
      template: body.template ?? "content",
      showInNav: body.showInNav,
    });
    return NextResponse.json(page, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create page";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
