import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { EMAIL_TEMPLATE_STARTER } from "@/lib/email/templates";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    name?: string;
    subject?: string;
    htmlBody?: string;
  };

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const htmlBody = body.htmlBody?.trim() || EMAIL_TEMPLATE_STARTER;

  const template = await prisma.emailTemplate.create({
    data: {
      name,
      subject: body.subject?.trim() ?? "",
      htmlBody,
    },
  });

  return NextResponse.json(template, { status: 201 });
}
