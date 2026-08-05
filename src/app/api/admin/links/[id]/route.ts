import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { normalizeExternalUrl } from "@/lib/admin-links";
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
    url?: string;
    sortOrder?: number;
  };

  const existing = await prisma.adminLink.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: { name?: string; url?: string; sortOrder?: number } = {};

  if (body.name !== undefined) {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    data.name = name;
  }

  if (body.url !== undefined) {
    const url = normalizeExternalUrl(body.url);
    if (!url) {
      return NextResponse.json(
        { error: "A valid URL is required (https://...)" },
        { status: 400 },
      );
    }
    data.url = url;
  }

  if (body.sortOrder !== undefined) {
    const n = Number(body.sortOrder);
    if (!Number.isFinite(n)) {
      return NextResponse.json(
        { error: "sortOrder must be a number" },
        { status: 400 },
      );
    }
    data.sortOrder = Math.floor(n);
  }

  const link = await prisma.adminLink.update({
    where: { id },
    data,
  });

  return NextResponse.json(link);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await prisma.adminLink.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
