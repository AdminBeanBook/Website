import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

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
    taxExempt?: boolean;
    tagIds?: string[];
    addressName?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    addressCity?: string | null;
    addressState?: string | null;
    addressPostal?: string | null;
    addressCountry?: string | null;
  };

  const data: {
    name?: string;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
    active?: boolean;
    taxExempt?: boolean;
    tags?: { set: { id: string }[] };
    addressName?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    addressCity?: string | null;
    addressState?: string | null;
    addressPostal?: string | null;
    addressCountry?: string | null;
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
  if (body.taxExempt !== undefined) data.taxExempt = body.taxExempt;
  if (body.tagIds !== undefined) {
    data.tags = { set: body.tagIds.map((tid) => ({ id: tid })) };
  }
  if (body.addressName !== undefined) data.addressName = optionalText(body.addressName);
  if (body.addressLine1 !== undefined) data.addressLine1 = optionalText(body.addressLine1);
  if (body.addressLine2 !== undefined) data.addressLine2 = optionalText(body.addressLine2);
  if (body.addressCity !== undefined) data.addressCity = optionalText(body.addressCity);
  if (body.addressState !== undefined) data.addressState = optionalText(body.addressState);
  if (body.addressPostal !== undefined) data.addressPostal = optionalText(body.addressPostal);
  if (body.addressCountry !== undefined) {
    data.addressCountry = optionalText(body.addressCountry) ?? "US";
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
