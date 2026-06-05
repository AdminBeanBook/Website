import Link from "next/link";
import {
  isManualOrder,
  isUnfulfilled,
  isUnpaid,
  normalizeOrderStatus,
  statusLabel,
  type OrderTab,
} from "@/lib/orders/status";

export type OrderListRowData = {
  id: string;
  customerEmail: string;
  customerName: string | null;
  amountCents: number;
  status: string;
  createdAt: Date;
  stripeSessionId: string;
  labelUrl: string | null;
  trackingNumber: string | null;
  invoiceSentAt: Date | null;
  discountCode: string | null;
};

type OrderListRowProps = {
  order: OrderListRowData;
  fromTab: OrderTab;
};

function statusBadgeClass(status: string): string {
  const s = normalizeOrderStatus(status);
  if (s === "unpaid") return "bg-amber-100 text-amber-900";
  if (s === "paid") return "bg-blue-100 text-blue-900";
  if (s === "archived") return "bg-gray-100 text-gray-700";
  return "bg-gray-100 text-gray-600";
}

export function OrderListRow({ order, fromTab }: OrderListRowProps) {
  const href =
    fromTab === "all"
      ? `/admin/orders/${order.id}`
      : `/admin/orders/${order.id}?from=${fromTab}`;

  const date = order.createdAt.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = order.createdAt.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const hints: string[] = [];
  if (order.labelUrl) hints.push("Label");
  else if (isUnfulfilled(order)) hints.push("Ship");
  if (order.invoiceSentAt) hints.push("Invoiced");
  if (isManualOrder(order.stripeSessionId)) hints.push("Manual");

  return (
    <Link
      href={href}
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-b border-gray-100 px-3 py-2.5 text-sm transition last:border-b-0 hover:bg-gray-50 sm:grid-cols-[7rem_minmax(0,1fr)_5rem_5.5rem_auto]"
    >
      <span className="text-gray-500 sm:col-start-1">
        <span className="block">{date}</span>
        <span className="text-xs">{time}</span>
      </span>

      <span className="min-w-0 sm:col-start-2">
        <span className="block truncate font-medium text-gray-900">
          {order.customerName || order.customerEmail}
        </span>
        {order.customerName && (
          <span className="block truncate text-xs text-gray-500">
            {order.customerEmail}
          </span>
        )}
      </span>

      <span className="font-semibold tabular-nums text-gray-900 sm:col-start-3 sm:text-right">
        ${(order.amountCents / 100).toFixed(2)}
      </span>

      <span
        className={`w-fit rounded px-2 py-0.5 text-xs font-medium ${statusBadgeClass(order.status)} sm:col-start-4`}
      >
        {statusLabel(order.status)}
      </span>

      <span className="flex flex-wrap justify-end gap-1 text-xs text-gray-500 sm:col-start-5">
        {hints.map((h) => (
          <span
            key={h}
            className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600"
          >
            {h}
          </span>
        ))}
        {order.trackingNumber && (
          <span className="max-w-[8rem] truncate rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-600">
            {order.trackingNumber}
          </span>
        )}
        {isUnpaid(order.status) && !order.invoiceSentAt && (
          <span className="text-amber-700">Due</span>
        )}
      </span>
    </Link>
  );
}
