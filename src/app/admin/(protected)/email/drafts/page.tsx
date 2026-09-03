import { EmailDraftsList } from "@/components/admin/EmailDraftsList";
import { requireAdminSession } from "@/lib/auth";
import { serializeDraft } from "@/lib/email/drafts";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function AdminEmailDraftsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  const drafts = await prisma.emailDraft.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return <EmailDraftsList initialDrafts={drafts.map(serializeDraft)} />;
}
