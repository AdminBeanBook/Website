import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { setDefaultPackagePreset } from "@/lib/shipping/packages";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packages = await prisma.packagePreset.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });
  return NextResponse.json(packages);
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    lengthIn?: number;
    widthIn?: number;
    heightIn?: number;
    weightOz?: number;
    isDefault?: boolean;
  };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const lengthIn = Number(body.lengthIn);
  const widthIn = Number(body.widthIn);
  const heightIn = Number(body.heightIn);
  const weightOz = Number(body.weightOz);

  if (
    !Number.isFinite(lengthIn) ||
    !Number.isFinite(widthIn) ||
    !Number.isFinite(heightIn) ||
    !Number.isFinite(weightOz) ||
    lengthIn <= 0 ||
    widthIn <= 0 ||
    heightIn <= 0 ||
    weightOz <= 0
  ) {
    return NextResponse.json(
      { error: "Dimensions and weight must be positive numbers" },
      { status: 400 },
    );
  }

  const count = await prisma.packagePreset.count();
  const isDefault = body.isDefault ?? count === 0;

  const record = await prisma.packagePreset.create({
    data: {
      name: body.name.trim(),
      lengthIn,
      widthIn,
      heightIn,
      weightOz,
      isDefault: false,
    },
  });

  if (isDefault) {
    await setDefaultPackagePreset(record.id);
    const updated = await prisma.packagePreset.findUnique({
      where: { id: record.id },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json(record);
}
