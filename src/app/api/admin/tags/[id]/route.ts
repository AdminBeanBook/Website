import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { slugifyTag } from "@/lib/contacts/slug";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { name?: string; color?: string };

  const data: { name?: string; slug?: string; color?: string } = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    data.name = name;
    let slug = slugifyTag(name);
    const clash = await prisma.contactTag.findFirst({
      where: { slug, NOT: { id } },
    });
    if (clash) slug = `${slug}-${id.slice(-4)}`;
    data.slug = slug;
  }
  if (body.color !== undefined) {
    data.color = body.color.trim() || "#226932";
  }

  try {
    const tag = await prisma.contactTag.update({
      where: { id },
      data,
      include: { _count: { select: { contacts: true } } },
    });
    return NextResponse.json({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      contactCount: tag._count.contacts,
    });
  } catch {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await prisma.contactTag.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }
}
