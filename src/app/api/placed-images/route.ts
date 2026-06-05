import { NextResponse } from "next/server";
import { getPageContent, type PageContentVariant } from "@/lib/pages";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug")?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const variant = (searchParams.get("variant") ?? "published") as PageContentVariant;
  if (variant !== "published" && variant !== "draft") {
    return NextResponse.json({ error: "invalid variant" }, { status: 400 });
  }

  const page = await getPageContent(slug, variant);
  if (!page) {
    return NextResponse.json({ images: [] });
  }

  return NextResponse.json({ images: page.placedImages });
}
