import Link from "next/link";
import type { Customer, Order } from "@prisma/client";
import { OrderNotesCard } from "@/components/admin/order-detail/OrderNotesCard";
import { orderSourceLabel } from "@/lib/orders/display";
import { isManualOrder } from "@/lib/orders/status";

type OrderCustomerSidebarProps = {
  order: Pick<
    Order,
    | "id"
    | "notes"
    | "customerEmail"
    | "customerName"
    | "customerPhone"
    | "shippingName"
    | "shippingLine1"
    | "shippingLine2"
    | "shippingCity"
    | "shippingState"
    | "shippingPostal"
    | "shippingCountry"
    | "stripeSessionId"
  >;
  customer: Customer | null;
  customerOrderCount: number;
};

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <h2 className="border-b border-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-900">
        {title}
      </h2>
      <div className="px-4 py-3 text-sm text-gray-700">{children}</div>
    </section>
  );
}

function formatAddress(order: OrderCustomerSidebarProps["order"]): string[] {
  const lines: string[] = [];
  if (order.shippingName) lines.push(order.shippingName);
  if (order.shippingLine1) lines.push(order.shippingLine1);
  if (order.shippingLine2) lines.push(order.shippingLine2);
  const cityLine = [
    order.shippingCity,
    order.shippingState,
    order.shippingPostal,
  ]
    .filter(Boolean)
    .join(", ");
  if (cityLine) lines.push(cityLine);
  if (order.shippingCountry && order.shippingCountry !== "US") {
    lines.push(order.shippingCountry);
  }
  return lines;
}

export function OrderCustomerSidebar({
  order,
  customer,
  customerOrderCount,
}: OrderCustomerSidebarProps) {
  const addressLines = formatAddress(order);
  const displayName = order.customerName || order.shippingName;
  const mapQuery = addressLines.join(", ");
  const mapUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
      <OrderNotesCard orderId={order.id} notes={order.notes ?? ""} />

      <SidebarCard title="Customer">
        <div className="space-y-4">
          <div>
            <p className="font-medium text-brand-green">
              {displayName || order.customerEmail}
            </p>
            <p className="text-xs text-gray-500">
              {customerOrderCount} order
              {customerOrderCount === 1 ? "" : "s"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Contact
            </p>
            <a
              href={`mailto:${order.customerEmail}`}
              className="mt-1 block text-brand-green hover:underline"
            >
              {order.customerEmail}
            </a>
            {order.customerPhone && (
              <a
                href={`tel:${order.customerPhone.replace(/\s/g, "")}`}
                className="mt-1 block text-gray-700 hover:underline"
              >
                {order.customerPhone}
              </a>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Shipping address
            </p>
            {addressLines.length > 0 ? (
              <>
                <address className="mt-1 not-italic leading-relaxed">
                  {addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs text-brand-green hover:underline"
                  >
                    View map
                  </a>
                )}
              </>
            ) : (
              <p className="mt-1 text-gray-500">No shipping address</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Billing address
            </p>
            <p className="mt-1 text-gray-500">Same as shipping address</p>
          </div>
        </div>
      </SidebarCard>

      <SidebarCard title="Order details">
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <span className="text-gray-500">Source: </span>
            {orderSourceLabel(order.stripeSessionId)}
          </li>
          {customer && (
            <li>
              <Link
                href="/admin/settings/customers"
                className="text-brand-green hover:underline"
              >
                View customers
              </Link>
            </li>
          )}
          {isManualOrder(order.stripeSessionId) && (
            <li className="font-mono text-xs text-gray-400">{order.id}</li>
          )}
        </ul>
      </SidebarCard>

      {customerOrderCount === 1 && (
        <section className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
          This is their first order.
        </section>
      )}
    </aside>
  );
}
