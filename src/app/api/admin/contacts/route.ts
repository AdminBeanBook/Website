import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseEmailList } from "@/lib/email/recipients";

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get("tagId")?.trim();

  const contacts = await prisma.contact.findMany({
    where: tagId ? { tags: { some: { id: tagId } } } : undefined,
    include: { tags: { orderBy: { name: "asc" } } },
    orderBy: [{ name: "asc" }],
  });

  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    tagIds?: string[];
    bulk?: string;
    defaultTagId?: string;
  };

  if (body.bulk) {
    const emails = parseEmailList(body.bulk);
    if (emails.length === 0) {
      return NextResponse.json({ error: "No valid emails" }, { status: 400 });
    }

    const tagConnect = body.defaultTagId
      ? { connect: { id: body.defaultTagId } }
      : undefined;

    let imported = 0;
    for (const email of emails) {
      const existing = await prisma.contact.findFirst({
        where: { email: { equals: email } },
      });
      if (existing) {
        if (body.defaultTagId) {
          await prisma.contact.update({
            where: { id: existing.id },
            data: { tags: { connect: { id: body.defaultTagId } }, active: true },
          });
        }
        imported += 1;
        continue;
      }
      await prisma.contact.create({
        data: {
          name: email.split("@")[0] ?? email,
          email,
          active: true,
          ...(tagConnect ? { tags: tagConnect } : {}),
        },
      });
      imported += 1;
    }
    return NextResponse.json({ imported });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() || null;
  const tagIds = body.tagIds?.filter(Boolean) ?? [];

  try {
    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        phone: body.phone?.trim() || null,
        notes: body.notes?.trim() || null,
        tags: tagIds.length
          ? { connect: tagIds.map((id) => ({ id })) }
          : undefined,
      },
      include: { tags: true },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Could not create contact" },
      { status: 400 },
    );
  }
}
