import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { slugifyTag } from "@/lib/contacts/slug";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = await prisma.contactTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { contacts: true } } },
  });

  return NextResponse.json(
    tags.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      color: t.color,
      contactCount: t._count.contacts,
      createdAt: t.createdAt,
    })),
  );
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; color?: string };
  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  let slug = slugifyTag(name);
  const existingSlug = await prisma.contactTag.findUnique({ where: { slug } });
  if (existingSlug) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  try {
    const tag = await prisma.contactTag.create({
      data: {
        name,
        slug,
        color: body.color?.trim() || "#226932",
      },
    });
    return NextResponse.json({ ...tag, contactCount: 0 }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "A tag with that name already exists" },
      { status: 400 },
    );
  }
}
