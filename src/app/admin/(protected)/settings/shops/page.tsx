import { CoffeeShopsManager } from "@/components/admin/CoffeeShopsManager";
import { requireAdminSession } from "@/lib/auth";
import { listCoffeeShops } from "@/lib/coffee-shops";
import { redirect } from "next/navigation";

export default async function CoffeeShopsSettingsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  const shops = await listCoffeeShops();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Coffee shops</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage the shop cards on your public map page — names, addresses,
          websites, and visibility.
        </p>
      </div>
      <CoffeeShopsManager initialShops={shops} />
    </div>
  );
}
