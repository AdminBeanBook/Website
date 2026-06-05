"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type OrderNotesCardProps = {
  orderId: string;
  notes: string;
};

export function OrderNotesCard({ orderId, notes }: OrderNotesCardProps) {
  const router = useRouter();
  const [value, setValue] = useState(notes);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
        <h2 className="text-sm font-semibold text-gray-900">Notes</h2>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || value === notes}
          className="text-xs font-medium text-brand-green hover:underline disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <div className="px-4 py-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="No notes"
          rows={3}
          className="w-full resize-y border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
        />
        <p className="mt-1 text-xs text-gray-400">
          Internal only — USPS tracking, special instructions, etc.
        </p>
      </div>
    </section>
  );
}
