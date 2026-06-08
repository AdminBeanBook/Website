"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ContactTagRow } from "@/lib/contacts/types";
import type { CustomerRow } from "@/lib/customers/types";

type CustomerDetailProps = {
  customer: CustomerRow;
  allTags: ContactTagRow[];
};

export function CustomerDetail({ customer, allTags }: CustomerDetailProps) {
  const router = useRouter();
  const [tagIds, setTagIds] = useState(customer.tags.map((tag) => tag.id));
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const selectedTags = allTags.filter((tag) => tagIds.includes(tag.id));

  async function save(patch: { tagIds?: string[]; notes?: string }) {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/admin/customers/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setSaving(false);

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setMessage(data.error ?? "Failed to save");
      return;
    }

    setMessage("Saved");
    router.refresh();
  }

  function toggleTag(tagId: string) {
    const next = tagIds.includes(tagId)
      ? tagIds.filter((id) => id !== tagId)
      : [...tagIds, tagId];
    setTagIds(next);
    void save({ tagIds: next, notes });
  }

  async function saveNotes() {
    await save({ tagIds, notes });
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/settings/customers"
          className="text-sm text-brand-green hover:underline"
        >
          ← All customers
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{customer.email}</h1>
        <p className="text-sm text-gray-600">
          {customer.name ?? "No name"} · {customer.phone ?? "No phone"}
        </p>
      </div>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Tags</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tags are saved to the database and stay on this customer.
        </p>

        {allTags.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No tags yet.{" "}
            <Link
              href="/admin/settings/contacts/tags"
              className="text-brand-green hover:underline"
            >
              Create tags
            </Link>{" "}
            in Contacts settings first.
          </p>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            {allTags.map((tag) => {
              const active = tagIds.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  disabled={saving}
                  onClick={() => toggleTag(tag.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-60 ${
                    active
                      ? "border-transparent text-white"
                      : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                  }`}
                  style={active ? { backgroundColor: tag.color } : undefined}
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              );
            })}
          </div>
        )}

        {selectedTags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Internal notes about this customer…"
        />
        <button
          type="button"
          onClick={saveNotes}
          disabled={saving}
          className="mt-3 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Orders ({customer.orderCount})
        </h2>
        {customer.orders && customer.orders.length > 0 ? (
          <ul className="mt-4 divide-y divide-gray-100">
            {customer.orders.map((order) => (
              <li key={order.id} className="py-3">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="text-sm text-brand-green hover:underline"
                >
                  {new Date(order.createdAt).toLocaleDateString()} — $
                  {(order.amountCents / 100).toFixed(2)} ({order.status})
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No orders yet.</p>
        )}
      </section>

      {message && (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
