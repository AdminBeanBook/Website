import Link from "next/link";
import { AdminAccessManager } from "@/components/admin/AdminAccessManager";
import { listAdminUsers } from "@/lib/admin/users";
import { requireAdminSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminAccessSettingsPage() {
  const admin = await requireAdminSession();
  if (!admin) redirect("/admin/login");

  const users = await listAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin access</h1>
        <p className="mt-1 text-sm text-gray-500">
          Control who can sign in and manage the Bean Book admin.
        </p>
      </div>
      <AdminAccessManager
        initialUsers={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={admin.id}
      />
      <Link
        href="/admin/email"
        className="text-sm text-brand-green hover:underline"
      >
        ← Email
      </Link>
    </div>
  );
}
