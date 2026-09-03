import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { serializeDraft } from "@/lib/email/drafts";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const drafts = await prisma.emailDraft.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(drafts.map(serializeDraft));
}