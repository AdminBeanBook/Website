import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageDetail } from "@/components/admin/MessageDetail";
import { MessageDetailNav } from "@/components/admin/MessageDetailNav";
import { prisma } from "@/lib/db";
import { ensureEmailSettings, getEmailSenders } from "@/lib/email/senders";
import { isEmailConfigured } from "@/lib/email/send";

type MessageDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminMessageDetailPage({
  params,
}: MessageDetailPageProps) {
  const { id } = await params;

  const message = await prisma.contactSubmission.findUnique({ where: { id } });
  if (!message) notFound();

  if (!message.read) {
    await prisma.contactSubmission.update({
      where: { id },
      data: { read: true },
    });
  }

  const [newer, older] = await Promise.all([
    prisma.contactSubmission.findFirst({
      where: { createdAt: { gt: message.createdAt } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    }),
    prisma.contactSubmission.findFirst({
      where: { createdAt: { lt: message.createdAt } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    }),
  ]);

  await ensureEmailSettings();
  const senders = await getEmailSenders();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/messages"
            className="text-sm text-brand-green hover:underline"
          >
            ← All messages
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">Message</h1>
        </div>
        <MessageDetailNav newerId={newer?.id ?? null} olderId={older?.id ?? null} />
      </div>

      <MessageDetail
        message={{
          ...message,
          read: true,
          createdAt: message.createdAt.toISOString(),
        }}
        senders={senders}
        emailConfigured={isEmailConfigured()}
      />
    </div>
  );
}
