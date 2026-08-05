"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AdminLinkRow } from "@/lib/admin-links";

type AdminLinksManagerProps = {
  initialLinks: AdminLinkRow[];
};

const inputClass =
  "w-full rounded border border-gray-300 px-2 py-1.5 text-sm";

function toRow(link: {
  id: string;
  name: string;
  url: string;
  sortOrder: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}): AdminLinkRow {
  return {
    id: link.id,
    name: link.name,
    url: link.url,
    sortOrder: link.sortOrder,
    createdAt:
      typeof link.createdAt === "string"
        ? link.createdAt
        : link.createdAt.toISOString(),
    updatedAt:
      typeof link.updatedAt === "string"
        ? link.updatedAt
        : link.updatedAt.toISOString(),
  };
}

export function AdminLinksManager({ initialLinks }: AdminLinksManagerProps) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const res = await fetch("/api/admin/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, url }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMessage(data.error ?? "Failed to add link");
      return;
    }
    setLinks((list) => [...list, toRow(data)].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)));
    setName("");
    setUrl("");
    setMessage("Link added");
    router.refresh();
  }

  async function updateLink(
    link: AdminLinkRow,
    patch: { name?: string; url?: string },
  ) {
    const res = await fetch(`/api/admin/links/${link.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json();
      setMessage(data.error ?? "Update failed");
      return;
    }
    const updated = toRow(await res.json());
    setLinks((list) => list.map((l) => (l.id === updated.id ? updated : l)));
  }

  async function removeLink(link: AdminLinkRow) {
    if (!confirm(`Remove “${link.name}”?`)) return;
    const res = await fetch(`/api/admin/links/${link.id}`, { method: "DELETE" });
    if (!res.ok) return;
    setLinks((list) => list.filter((l) => l.id !== link.id));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Add link</h2>
        <p className="mt-1 text-sm text-gray-500">
          Save reporting dashboards, Stripe, Shippo, analytics, or any tool you
          open often. They also appear on the admin dashboard.
        </p>
        <form
          onSubmit={handleAdd}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]"
        >
          <div>
            <label className="text-xs font-medium text-gray-600">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Stripe Dashboard"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">URL</label>
            <input
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={inputClass}
              placeholder="https://dashboard.stripe.com"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-brand-green px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </form>
        {message && (
          <p className="mt-3 text-sm text-brand-green">{message}</p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Your links</h2>
        {links.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No links yet. Add one above.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    defaultValue={link.name}
                    className={inputClass}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next && next !== link.name) {
                        void updateLink(link, { name: next });
                      }
                    }}
                    aria-label="Link name"
                  />
                  <input
                    defaultValue={link.url}
                    className={inputClass}
                    onBlur={(e) => {
                      const next = e.target.value.trim();
                      if (next && next !== link.url) {
                        void updateLink(link, { url: next });
                      }
                    }}
                    aria-label="Link URL"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg border border-brand-green px-3 py-1.5 text-sm font-medium text-brand-green hover:bg-brand-green/5"
                  >
                    Open →
                  </a>
                  <button
                    type="button"
                    onClick={() => void removeLink(link)}
                    className="rounded-lg px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
