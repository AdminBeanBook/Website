import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    active?: boolean;
    tagIds?: string[];
  };

  const data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    active?: boolean;
    tags?: { set: { id: string }[] };
  } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    data.name = name;
  }
  if (body.email !== undefined) {
    data.email = body.email?.trim().toLowerCase() || null;
  }
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.notes !== undefined) data.notes = body.notes?.trim() || null;
  if (body.active !== undefined) data.active = body.active;
  if (body.tagIds !== undefined) {
    data.tags = { set: body.tagIds.map((tid) => ({ id: tid })) };
  }

  try {
    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: { tags: true },
    });
    return NextResponse.json(contact);
  } catch {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }
}
