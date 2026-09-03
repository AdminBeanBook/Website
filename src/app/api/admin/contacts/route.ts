import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { normalizeContactAddress } from "@/lib/contacts/address";
import { importContactsFromCsv } from "@/lib/contacts/import-csv";
import { prisma } from "@/lib/db";
import { parseEmailList } from "@/lib/email/recipients";

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get("tagId")?.trim();
  const email = searchParams.get("email")?.trim().toLowerCase();
  const q = searchParams.get("q")?.trim();

  const contacts = await prisma.contact.findMany({
    where: {
      ...(tagId ? { tags: { some: { id: tagId } } } : {}),
      ...(email && !q
        ? { email: { equals: email, mode: "insensitive" as const } }
        : {}),
      ...(q
        ? {
            active: true,
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { company: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
              { phone: { contains: q, mode: "insensitive" as const } },
              { addressName: { contains: q, mode: "insensitive" as const } },
              { addressLine1: { contains: q, mode: "insensitive" as const } },
              { addressCity: { contains: q, mode: "insensitive" as const } },
              { addressPostal: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    include: { tags: { orderBy: { name: "asc" } } },
    orderBy: [{ name: "asc" }],
    take: q ? 12 : undefined,
  });

  return NextResponse.json(contacts);
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    company?: string;
    name?: string;
    email?: string;
    phone?: string;
    notes?: string;
    tagIds?: string[];
    taxExempt?: boolean;
    addressName?: string;
    addressLine1?: string;
    addressLine2?: string;
    addressCity?: string;
    addressState?: string;
    addressPostal?: string;
    addressCountry?: string;
    bulk?: string;
    csv?: string;
    defaultTagId?: string;
  };

  if (body.csv) {
    if (body.csv.length > 2_000_000) {
      return NextResponse.json(
        { error: "CSV is too large (2 MB max)" },
        { status: 400 },
      );
    }
    try {
      const result = await importContactsFromCsv(
        body.csv,
        body.defaultTagId,
      );
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json(
        {
          error:
            err instanceof Error ? err.message : "Could not import CSV",
        },
        { status: 400 },
      );
    }
  }

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
    const address = normalizeContactAddress({
      addressName: body.addressName,
      addressLine1: body.addressLine1,
      addressLine2: body.addressLine2,
      addressCity: body.addressCity,
      addressState: body.addressState,
      addressPostal: body.addressPostal,
      addressCountry: body.addressCountry,
    });

    const contact = await prisma.contact.create({
      data: {
        company: body.company?.trim() || null,
        name,
        email,
        phone: body.phone?.trim() || null,
        notes: body.notes?.trim() || null,
        taxExempt: Boolean(body.taxExempt),
        ...(address ?? {}),
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
