import Link from "next/link";
import { DiscountManager } from "@/components/admin/DiscountManager";
import { prisma } from "@/lib/db";

export default async function AdminDiscountsPage() {
  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Discount codes</h1>
      <DiscountManager
        initialCodes={codes.map((c) => ({
          ...c,
          expiresAt: c.expiresAt?.toISOString() ?? null,
        }))}
      />
      <Link href="/admin" className="text-sm text-brand-green hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
