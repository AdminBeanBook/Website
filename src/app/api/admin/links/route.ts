import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { normalizeExternalUrl } from "@/lib/admin-links";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const links = await prisma.adminLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(links);
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    url?: string;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const url = normalizeExternalUrl(body.url ?? "");
  if (!url) {
    return NextResponse.json(
      { error: "A valid URL is required (https://...)" },
      { status: 400 },
    );
  }

  const last = await prisma.adminLink.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const link = await prisma.adminLink.create({
    data: {
      name,
      url,
      sortOrder: (last?.sortOrder ?? 0) + 1,
    },
  });

  return NextResponse.json(link, { status: 201 });
}
