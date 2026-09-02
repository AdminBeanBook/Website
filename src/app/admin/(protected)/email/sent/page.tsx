import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SentEmailList } from "@/components/admin/SentEmailList";
import { redirect } from "next/navigation";

export default async function AdminEmailSentPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  const batches = await prisma.sentEmailBatch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      recipients: { orderBy: { email: "asc" } },
    },
  });

  return (
    <SentEmailList
      initialBatches={batches.map((batch) => ({
        id: batch.id,
        subject: batch.subject,
        senderKey: batch.senderKey,
        fromEmail: batch.fromEmail,
        fromName: batch.fromName,
        audience: batch.audience,
        htmlBody: batch.htmlBody,
        recipientCount: batch.recipientCount,
        successCount: batch.successCount,
        failureCount: batch.failureCount,
        sentByEmail: batch.sentByEmail,
        dryRun: batch.dryRun,
        createdAt: batch.createdAt.toISOString(),
        recipients: batch.recipients.map((r) => ({
          id: r.id,
          email: r.email,
          name: r.name,
          status: r.status,
          error: r.error,
        })),
      }))}
    />
  );
}
