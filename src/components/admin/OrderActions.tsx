"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { SendInvoiceButton } from "@/components/admin/SendInvoiceButton";
import {
  isManualOrder,
  isUnpaid,
  normalizeOrderStatus,
  statusLabel,
} from "@/lib/orders/status";

type OrderActionsProps = {
  orderId: string;
  status: string;
  notes: string;
  stripeSessionId: string;
  hasLabel: boolean;
  invoiceHostedUrl?: string | null;
  invoiceSentAt?: string | null;
  variant?: "sidebar" | "toolbar";
};

export function OrderActions({
  orderId,
  status,
  notes,
  stripeSessionId,
  hasLabel,
  invoiceHostedUrl,
  invoiceSentAt,
  variant = "sidebar",
}: OrderActionsProps) {
  const router = useRouter();
  const [markingPaid, setMarkingPaid] = useState(false);
  const normalized = normalizeOrderStatus(status);

  async function handleMarkPaid() {
    setMarkingPaid(true);
    const nextStatus = hasLabel ? "archived" : "paid";
    await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setMarkingPaid(false);
    router.refresh();
  }

  const toolbarBtn =
    "rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-60";
  const primaryToolbarBtn =
    "rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60";

  if (variant === "toolbar") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {isUnpaid(status) && (
          <>
            <SendInvoiceButton
              orderId={orderId}
              invoiceHostedUrl={invoiceHostedUrl}
              invoiceSentAt={invoiceSentAt}
              compact
            />
            <button
              type="button"
              onClick={handleMarkPaid}
              disabled={markingPaid}
              className={primaryToolbarBtn}
            >
              {markingPaid ? "Updating…" : "Mark as paid"}
            </button>
          </>
        )}
        <OrderStatusForm
          orderId={orderId}
          status={status}
          notes={notes}
          variant="toolbar"
        />
      </div>
    );
  }

  return (
    <div className="flex min-w-[200px] flex-col gap-2">
      <span
        className={`inline-flex w-fit rounded px-2 py-0.5 text-xs font-medium ${
          normalized === "unpaid"
            ? "bg-amber-100 text-amber-900"
            : normalized === "paid"
              ? "bg-blue-100 text-blue-900"
              : normalized === "archived"
                ? "bg-gray-100 text-gray-700"
                : "bg-gray-100 text-gray-600"
        }`}
      >
        {statusLabel(status)}
        {isManualOrder(stripeSessionId) && " · Manual"}
      </span>

      {isUnpaid(status) && (
        <>
          <SendInvoiceButton
            orderId={orderId}
            invoiceHostedUrl={invoiceHostedUrl}
            invoiceSentAt={invoiceSentAt}
          />
          <button
            type="button"
            onClick={handleMarkPaid}
            disabled={markingPaid}
            className="rounded bg-brand-green px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {markingPaid ? "Updating…" : "Mark as paid"}
          </button>
        </>
      )}

      <OrderStatusForm orderId={orderId} status={status} notes={notes} />
    </div>
  );
}
