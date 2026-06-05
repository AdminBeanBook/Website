import Link from "next/link";
import { MessageList } from "@/components/admin/MessageList";
import { prisma } from "@/lib/db";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Contact messages</h1>
      <MessageList
        initialMessages={messages.map((m) => ({
          ...m,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
      <Link href="/admin" className="text-sm text-brand-green hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
