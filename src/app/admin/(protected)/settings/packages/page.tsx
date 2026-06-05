import Link from "next/link";
import { PackageManager } from "@/components/admin/PackageManager";
import { listPackagePresets } from "@/lib/shipping/packages";

export default async function AdminPackagesPage() {
  const packages = await listPackagePresets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Shipping packages</h1>
        <p className="mt-2 text-sm text-gray-600">
          Define box and mailer sizes used when buying Shippo labels on orders.
        </p>
      </div>

      <PackageManager initialPackages={packages} />

      <Link href="/admin" className="text-sm text-brand-green hover:underline">
        ← Back to dashboard
      </Link>
    </div>
  );
}
