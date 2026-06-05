import type { Order } from "@prisma/client";
import { OrderBadge } from "@/components/admin/order-detail/OrderBadge";
import {
  formatMoney,
  getOrderAmountBreakdown,
  getPaymentBadge,
} from "@/lib/orders/display";
import { BEAN_BOOK_2026 } from "@/lib/products";

type OrderPaymentCardProps = {
  order: Pick<Order, "amountCents" | "discountCents" | "discountCode" | "status">;
};

export function OrderPaymentCard({ order }: OrderPaymentCardProps) {
  const payment = getPaymentBadge(order);
  const breakdown = getOrderAmountBreakdown(order);

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-3">
        <OrderBadge label={payment.label} variant={payment.variant} />
      </div>
      <dl className="divide-y divide-gray-100 text-sm">
        <div className="flex justify-between gap-4 px-5 py-2.5">
          <dt className="text-gray-600">
            Subtotal
            <span className="text-gray-400">
              {" "}
              · {breakdown.quantity}{" "}
              {breakdown.quantity === 1 ? "item" : "items"}
            </span>
          </dt>
          <dd className="tabular-nums text-gray-900">
            {formatMoney(breakdown.subtotalCents)}
          </dd>
        </div>
        {breakdown.discountCents > 0 && (
          <div className="flex justify-between gap-4 px-5 py-2.5">
            <dt className="text-gray-600">
              Discount
              {order.discountCode && (
                <span className="text-gray-400"> ({order.discountCode})</span>
              )}
            </dt>
            <dd className="tabular-nums text-gray-900">
              −{formatMoney(breakdown.discountCents)}
            </dd>
          </div>
        )}
        {breakdown.shippingAndFeesCents > 0 && (
          <div className="flex justify-between gap-4 px-5 py-2.5">
            <dt className="text-gray-600">Shipping &amp; fees</dt>
            <dd className="tabular-nums text-gray-900">
              {formatMoney(breakdown.shippingAndFeesCents)}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4 px-5 py-3 font-medium">
          <dt className="text-gray-900">Total</dt>
          <dd className="tabular-nums text-gray-900">
            {formatMoney(breakdown.totalCents)}
          </dd>
        </div>
      </dl>
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-sm">
        <OrderBadge label={payment.label} variant={payment.variant} />
        <span className="font-semibold tabular-nums text-gray-900">
          {formatMoney(breakdown.totalCents)}
        </span>
      </div>
      <p className="border-t border-gray-50 px-5 py-2 text-xs text-gray-400">
        {BEAN_BOOK_2026.name}
      </p>
    </section>
  );
}
