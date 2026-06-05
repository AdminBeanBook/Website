import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  ensureEmailSettings,
  getEmailSenders,
  saveEmailSenders,
  type EmailSender,
} from "@/lib/email/senders";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureEmailSettings();
  const senders = await getEmailSenders();
  return NextResponse.json({ senders });
}

export async function PUT(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { senders?: EmailSender[] };
  if (!body.senders?.length) {
    return NextResponse.json({ error: "Senders required" }, { status: 400 });
  }

  await saveEmailSenders(body.senders);
  return NextResponse.json({ senders: body.senders });
}
