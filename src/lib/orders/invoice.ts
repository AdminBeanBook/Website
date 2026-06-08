import type { Order } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyNewOrderEmail } from "@/lib/notifications/order-email";
import { BEAN_BOOK_2026 } from "@/lib/products";
import { getStripe } from "@/lib/stripe";
import { isUnpaid, normalizeOrderStatus } from "@/lib/orders/status";

const INVOICE_DUE_DAYS = 30;

async function getOrCreateStripeCustomer(
  email: string,
  name?: string | null,
) {
  const stripe = getStripe();
  const existing = await stripe.customers.list({ email, limit: 1 });

  if (existing.data[0]) {
    if (name && !existing.data[0].name) {
      return stripe.customers.update(existing.data[0].id, { name });
    }
    return existing.data[0];
  }

  return stripe.customers.create({
    email,
    name: name ?? undefined,
  });
}

function invoiceDescription(order: Order): string {
  const books =
    order.amountCents % BEAN_BOOK_2026.priceCents === 0
      ? order.amountCents / BEAN_BOOK_2026.priceCents
      : null;
  const qty = books && books > 1 ? ` (${books} books)` : "";
  return `${BEAN_BOOK_2026.name}${qty}`;
}

export async function sendStripeInvoiceForOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }
  if (!isUnpaid(order.status)) {
    throw new Error("Invoices can only be sent for unpaid orders");
  }
  if (order.stripeInvoiceId) {
    throw new Error("An invoice was already sent for this order");
  }
  if (!order.customerEmail) {
    throw new Error("Order is missing a customer email");
  }

  const stripe = getStripe();
  const customer = await getOrCreateStripeCustomer(
    order.customerEmail,
    order.customerName ?? order.shippingName,
  );

  await stripe.invoiceItems.create({
    customer: customer.id,
    amount: order.amountCents,
    currency: "usd",
    description: invoiceDescription(order),
  });

  const invoice = await stripe.invoices.create({
    customer: customer.id,
    collection_method: "send_invoice",
    days_until_due: INVOICE_DUE_DAYS,
    metadata: {
      order_id: order.id,
      product_id: order.productId ?? BEAN_BOOK_2026.id,
    },
  });

  const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
  const sent = await stripe.invoices.sendInvoice(finalized.id);

  // Status stays "unpaid" until Stripe sends invoice.paid via webhook (or admin marks paid).
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      stripeInvoiceId: sent.id,
      invoiceHostedUrl: sent.hosted_invoice_url ?? null,
      invoiceSentAt: new Date(),
    },
  });

  return {
    order: updated,
    hostedInvoiceUrl: sent.hosted_invoice_url,
  };
}

/** True when Stripe reports the invoice was actually paid (not just sent/open). */
export function isStripeInvoiceFullyPaid(invoice: {
  status: string | null;
  amount_paid?: number | null;
}): boolean {
  return invoice.status === "paid" && (invoice.amount_paid ?? 0) > 0;
}

export async function markOrderPaidFromInvoice(
  orderId: string,
  stripeInvoiceId: string,
  invoice?: { status: string | null; amount_paid?: number | null },
) {
  if (invoice && !isStripeInvoiceFullyPaid(invoice)) {
    console.warn(
      `invoice.paid ignored for order ${orderId}: status=${invoice.status} amount_paid=${invoice.amount_paid ?? 0}`,
    );
    return null;
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    console.warn(`invoice.paid: order not found (${orderId})`);
    return null;
  }

  const current = normalizeOrderStatus(order.status);
  if (current === "paid" || current === "archived") {
    if (!order.stripeInvoiceId) {
      return prisma.order.update({
        where: { id: orderId },
        data: { stripeInvoiceId },
      });
    }
    return order;
  }

  if (!isUnpaid(order.status)) {
    console.warn(
      `invoice.paid: order ${orderId} has status ${order.status}, skipping`,
    );
    return order;
  }

  const nextStatus = order.labelUrl ? "archived" : "paid";

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      stripeInvoiceId,
    },
  });

  void notifyNewOrderEmail(updated);

  return updated;
}

/** Resolve Bean Book order id from a paid Stripe invoice. */
export async function resolveOrderIdFromInvoice(invoice: {
  id: string;
  metadata?: Record<string, string> | null;
}): Promise<string | null> {
  const fromMeta = invoice.metadata?.order_id;
  if (fromMeta) return fromMeta;

  const order = await prisma.order.findFirst({
    where: { stripeInvoiceId: invoice.id },
    select: { id: true },
  });
  return order?.id ?? null;
}
