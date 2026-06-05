import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import {
  countRecipients,
  parseTagIds,
  type EmailAudience,
} from "@/lib/email/recipients";

export async function GET(request: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const audience = searchParams.get("audience") as EmailAudience;
  const custom = searchParams.get("custom") ?? "";
  const tagIds = parseTagIds(searchParams.get("tagIds") ?? undefined);

  if (!["customers", "contacts", "custom"].includes(audience)) {
    return NextResponse.json({ error: "Invalid audience" }, { status: 400 });
  }

  const count = await countRecipients(audience, { customEmails: custom, tagIds });
  return NextResponse.json({ count });
}
