import Link from "next/link";
import { AdminLinksManager } from "@/components/admin/AdminLinksManager";
import { prisma } from "@/lib/db";

export default async function AdminLinksPage() {
  const links = await prisma.adminLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Quick links</h1>
        <p className="mt-2 text-sm text-gray-600">
          Named shortcuts to reporting, Stripe, analytics, and other tools.
        </p>
      </div>

      <AdminLinksManager
        initialLinks={links.map((link) => ({
          id: link.id,
          name: link.name,
          url: link.url,
          sortOrder: link.sortOrder,
          createdAt: link.createdAt.toISOString(),
          updatedAt: link.updatedAt.toISOString(),
        }))}
      />

      <Link href="/admin" className="text-sm text-brand-green hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
