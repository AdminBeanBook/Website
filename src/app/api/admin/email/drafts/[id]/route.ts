import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { serializeDraft } from "@/lib/email/drafts";
import type { EmailAudience } from "@/lib/email/recipients";
import { prisma } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

function parseAudience(value: unknown): string | null {
  if (
    value === "customers" ||
    value === "contacts" ||
    value === "custom"
  ) {
    return value;
  }
  return null;
}

export async function PUT(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing draft" }, { status: 400 });
  }

  const body = (await request.json()) as {
    subject?: string;
    htmlBody?: string;
    senderKey?: string;
    audience?: EmailAudience | null;
    customEmails?: string;
    tagIds?: string[];
  };

  const data = {
    subject: body.subject?.trim() ?? "",
    htmlBody: body.htmlBody ?? "",
    senderKey: body.senderKey?.trim() || "customers",
    audience: parseAudience(body.audience),
    customEmails: body.customEmails ?? "",
    tagIdsJson: JSON.stringify(
      Array.isArray(body.tagIds)
        ? body.tagIds.filter((id) => typeof id === "string")
        : [],
    ),
  };

  const draft = await prisma.emailDraft.upsert({
    where: { id },
    create: { id, ...data },
    update: data,
  });
  return NextResponse.json(serializeDraft(draft));
}

export async function DELETE(_request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    await prisma.emailDraft.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}