import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { sendBulkEmail } from "@/lib/email/send";
import type { EmailAudience } from "@/lib/email/recipients";

export async function POST(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    senderKey?: string;
    subject?: string;
    htmlBody?: string;
    audience?: EmailAudience;
    customEmails?: string;
    tagIds?: string[];
    testOnly?: boolean;
    testEmail?: string;
  };

  if (!body.senderKey || !body.subject?.trim() || !body.htmlBody?.trim()) {
    return NextResponse.json(
      { error: "Sender, subject, and message are required" },
      { status: 400 },
    );
  }

  if (
    !body.audience ||
    !["customers", "contacts", "custom"].includes(body.audience)
  ) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  const tagIds = body.tagIds ?? [];

  try {
    const result = await sendBulkEmail({
      senderKey: body.senderKey,
      subject: body.subject.trim(),
      htmlBody: body.htmlBody,
      audience: body.audience,
      customEmails: body.customEmails,
      tagIds,
      sentByEmail: admin.email,
      testOnly: body.testOnly,
      testEmail: body.testEmail ?? admin.email,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Send failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
