"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  active: boolean;
  createdAt: string;
};

type AdminAccessManagerProps = {
  initialUsers: AdminUserRow[];
  currentUserId: string;
};

export function AdminAccessManager({
  initialUsers,
  currentUserId,
}: AdminAccessManagerProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = (await res.json()) as AdminUserRow & { error?: string };
    setLoading(false);

    if (!res.ok) {
      setMessage(data.error ?? "Failed to add admin");
      return;
    }

    setUsers((u) => [...u, { ...data, createdAt: new Date().toISOString() }]);
    setEmail("");
    setName("");
    setPassword("");
    setMessage("Admin added");
    router.refresh();
  }

  async function toggleActive(user: AdminUserRow) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    if (!res.ok) return;
    const updated = (await res.json()) as AdminUserRow;
    setUsers((list) => list.map((u) => (u.id === updated.id ? updated : u)));
  }

  async function handleRemove(user: AdminUserRow) {
    if (!confirm(`Remove admin access for ${user.email}?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMessage(data.error ?? "Failed to remove");
      return;
    }
    setUsers((list) => list.filter((u) => u.id !== user.id));
    setMessage("Admin removed");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">People with access</h2>
        <p className="mt-1 text-sm text-gray-500">
          Only these accounts can sign in to Bean Book Admin. Deactivated users
          cannot log in.
        </p>

        <ul className="mt-4 divide-y divide-gray-100">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {user.name || user.email}
                  {user.id === currentUserId && (
                    <span className="ml-2 text-xs text-gray-500">(you)</span>
                  )}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    user.active
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {user.active ? "Active" : "Disabled"}
                </span>
                {user.id !== currentUserId && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleActive(user)}
                      className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50"
                    >
                      {user.active ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(user)}
                      className="rounded border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Add admin</h2>
        <form onSubmit={handleAdd} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Name (optional)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Temporary password (min 8 characters)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              Share this password securely; they can sign in at /admin/login.
            </p>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {loading ? "Adding…" : "Grant admin access"}
            </button>
          </div>
        </form>
        {message && (
          <p className="mt-3 text-sm text-green-700" role="status">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
