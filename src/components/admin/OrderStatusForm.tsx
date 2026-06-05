"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  orderId: string;
  status: string;
  notes: string;
  variant?: "default" | "toolbar";
};

export function OrderStatusForm({
  orderId,
  status,
  notes,
  variant = "default",
}: Props) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentNotes, setCurrentNotes] = useState(notes);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        variant === "toolbar"
          ? { status: currentStatus }
          : { status: currentStatus, notes: currentNotes },
      ),
    });
    setSaving(false);
    router.refresh();
  }

  if (variant === "toolbar") {
    return (
      <div className="flex items-center gap-2">
        <select
          value={currentStatus}
          onChange={(e) => setCurrentStatus(e.target.value)}
          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
          aria-label="Order status"
        >
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="archived">Archived</option>
          <option value="refunded">Refunded</option>
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-70"
        >
          {saving ? "Saving…" : "Update status"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-w-[200px] flex-col gap-2">
      <select
        value={currentStatus}
        onChange={(e) => setCurrentStatus(e.target.value)}
        className="border border-gray-300 px-2 py-1 text-sm"
      >
        <option value="unpaid">Unpaid</option>
        <option value="paid">Paid</option>
        <option value="archived">Archived</option>
        <option value="refunded">Refunded</option>
      </select>
      <textarea
        value={currentNotes}
        onChange={(e) => setCurrentNotes(e.target.value)}
        placeholder="Internal notes (USPS tracking, etc.)"
        rows={2}
        className="border border-gray-300 px-2 py-1 text-sm"
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded bg-brand-green px-3 py-1 text-sm text-white disabled:opacity-70"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
