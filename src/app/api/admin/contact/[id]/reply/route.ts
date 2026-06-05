import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendContactReply } from "@/lib/email/contact-reply";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const submission = await prisma.contactSubmission.findUnique({ where: { id } });
  if (!submission) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    senderKey?: string;
    subject?: string;
    bodyText?: string;
  };

  if (!body.senderKey || !body.subject?.trim() || !body.bodyText?.trim()) {
    return NextResponse.json(
      { error: "Sender, subject, and message are required" },
      { status: 400 },
    );
  }

  try {
    const result = await sendContactReply({
      senderKey: body.senderKey,
      toEmail: submission.email,
      toName: submission.name,
      subject: body.subject.trim(),
      bodyText: body.bodyText.trim(),
      originalMessage: submission.message,
      originalDate: submission.createdAt,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
