"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  OrderListRow,
  type OrderListRowData,
} from "@/components/admin/OrderListRow";
import { isArchived, isUnpaid, type OrderTab } from "@/lib/orders/status";

const HEADER_GRID =
  "hidden sm:grid sm:grid-cols-[7rem_minmax(0,1fr)_5rem_5.5rem_auto] sm:gap-x-4";

type OrderListProps = {
  orders: OrderListRowData[];
  fromTab: OrderTab;
};

export function OrderList({ orders, fromTab }: OrderListProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ids = useMemo(() => orders.map((order) => order.id), [orders]);
  const selectedCount = selected.size;
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const someSelected = selectedCount > 0 && !allSelected;

  const selectedOrders = useMemo(
    () => orders.filter((order) => selected.has(order.id)),
    [orders, selected],
  );
  const canMarkPaid = selectedOrders.some((order) => isUnpaid(order.status));
  const canArchive = selectedOrders.some((order) => !isArchived(order.status));
  const canUnarchive = selectedOrders.some((order) => isArchived(order.status));

  function toggleOne(id: string, shiftKey: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (shiftKey && lastClickedId) {
        const from = ids.indexOf(lastClickedId);
        const to = ids.indexOf(id);
        if (from !== -1 && to !== -1) {
          const [start, end] = from < to ? [from, to] : [to, from];
          const shouldSelect = !prev.has(id);
          for (let i = start; i <= end; i += 1) {
            if (shouldSelect) next.add(ids[i]);
            else next.delete(ids[i]);
          }
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastClickedId(id);
  }

  function toggleAll() {
    setSelected((prev) => {
      if (ids.length > 0 && ids.every((id) => prev.has(id))) {
        return new Set();
      }
      return new Set(ids);
    });
  }

  async function applyStatus(
    status: "paid" | "archived",
    include: (order: OrderListRowData) => boolean,
  ) {
    const idsToUpdate = selectedOrders.filter(include).map((order) => order.id);
    if (idsToUpdate.length === 0) return;

    setBusy(true);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: idsToUpdate, status }),
    });
    setBusy(false);
    if (!res.ok) return;
    setSelected(new Set());
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-0 border-b border-gray-200 bg-gray-50 px-3 py-2">
        <label className="flex h-8 w-7 shrink-0 items-center justify-start">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
            aria-label={allSelected ? "Deselect all orders" : "Select all orders"}
            className="h-4 w-4 rounded border-gray-300 text-brand-green focus:ring-brand-green"
          />
        </label>
        {selectedCount > 0 ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-800">
              {selectedCount} selected
            </span>
            {canMarkPaid && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void applyStatus("paid", (order) => isUnpaid(order.status))
                }
                className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                Mark as paid
              </button>
            )}
            {canArchive && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void applyStatus("archived", (order) => !isArchived(order.status))
                }
                className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                Archive
              </button>
            )}
            {canUnarchive && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void applyStatus("paid", (order) => isArchived(order.status))
                }
                className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60"
              >
                Unarchive
              </button>
            )}
          </div>
        ) : (
          <div
            className={`${HEADER_GRID} min-w-0 flex-1 text-xs font-medium uppercase tracking-wide text-gray-500`}
          >
            <span>Date</span>
            <span>Customer</span>
            <span className="text-right">Total</span>
            <span>Status</span>
            <span className="text-right">Notes</span>
          </div>
        )}
      </div>
      <div role="list">
        {orders.map((order) => (
          <OrderListRow
            key={order.id}
            order={order}
            fromTab={fromTab}
            selected={selected.has(order.id)}
            onToggle={(shiftKey) => toggleOne(order.id, shiftKey)}
          />
        ))}
      </div>
    </div>
  );
}
