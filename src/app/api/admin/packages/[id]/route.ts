import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setDefaultPackagePreset } from "@/lib/shipping/packages";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    name?: string;
    lengthIn?: number;
    widthIn?: number;
    heightIn?: number;
    weightOz?: number;
    isDefault?: boolean;
  };

  const existing = await prisma.packagePreset.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: {
    name?: string;
    lengthIn?: number;
    widthIn?: number;
    heightIn?: number;
    weightOz?: number;
  } = {};

  if (body.name !== undefined) {
    if (!body.name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    data.name = body.name.trim();
  }

  for (const [key, val] of [
    ["lengthIn", body.lengthIn],
    ["widthIn", body.widthIn],
    ["heightIn", body.heightIn],
    ["weightOz", body.weightOz],
  ] as const) {
    if (val !== undefined) {
      const n = Number(val);
      if (!Number.isFinite(n) || n <= 0) {
        return NextResponse.json(
          { error: `${key} must be a positive number` },
          { status: 400 },
        );
      }
      data[key] = n;
    }
  }

  if (body.isDefault) {
    await setDefaultPackagePreset(id);
  }

  const record = await prisma.packagePreset.update({
    where: { id },
    data,
  });

  return NextResponse.json(record);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.packagePreset.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const count = await prisma.packagePreset.count();
  if (count <= 1) {
    return NextResponse.json(
      { error: "Keep at least one package preset" },
      { status: 400 },
    );
  }

  await prisma.packagePreset.delete({ where: { id } });

  if (existing.isDefault) {
    const next = await prisma.packagePreset.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (next) {
      await setDefaultPackagePreset(next.id);
    }
  }

  return NextResponse.json({ ok: true });
}
