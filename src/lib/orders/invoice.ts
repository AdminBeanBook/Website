import type { Order } from "@prisma/client";
import { contactTaxExemptForEmail } from "@/lib/contacts/tax-exempt";
import { prisma } from "@/lib/db";
import { notifyNewOrderEmail } from "@/lib/notifications/order-email";
import { BEAN_BOOK_2026 } from "@/lib/products";
import { getStripe } from "@/lib/stripe";
import { isComplimentaryOrder, isUnpaid, normalizeOrderStatus } from "@/lib/orders/status";

const INVOICE_DUE_DAYS = 30;

async function getOrCreateStripeCustomer(
  email: string,
  name: string | null | undefined,
  taxExempt: boolean,
) {
  const stripe = getStripe();
  const tax_exempt = taxExempt ? "exempt" : "none";
  const existing = await stripe.customers.list({ email, limit: 1 });

  if (existing.data[0]) {
    return stripe.customers.update(existing.data[0].id, {
      ...(name && !existing.data[0].name ? { name } : {}),
      tax_exempt,
    });
  }

  return stripe.customers.create({
    email,
    name: name ?? undefined,
    tax_exempt,
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

export type InvoicePreview = {
  stripeInvoiceId: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  customerEmail: string | null;
  customerName: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  dueDate: string | null;
  lineItems: { description: string; amountCents: number }[];
  sent: boolean;
};

function mapInvoicePreview(
  invoice: {
    id: string;
    hosted_invoice_url?: string | null;
    invoice_pdf?: string | null;
    customer_email?: string | null;
    customer_name?: string | null;
    subtotal: number | null;
    tax?: number | null;
    total: number | null;
    amount_due: number | null;
    due_date: number | null;
    lines?: { data: { description: string | null; amount: number }[] };
  },
  sent: boolean,
): InvoicePreview {
  const subtotalCents = invoice.subtotal ?? 0;
  const totalCents = invoice.total ?? invoice.amount_due ?? 0;
  return {
    stripeInvoiceId: invoice.id,
    hostedInvoiceUrl: invoice.hosted_invoice_url ?? null,
    invoicePdf: invoice.invoice_pdf ?? null,
    customerEmail: invoice.customer_email ?? null,
    customerName: invoice.customer_name ?? null,
    subtotalCents,
    taxCents: invoice.tax ?? Math.max(0, totalCents - subtotalCents),
    totalCents,
    dueDate: invoice.due_date
      ? new Date(invoice.due_date * 1000).toISOString()
      : null,
    lineItems: (invoice.lines?.data ?? []).map((line) => ({
      description: line.description || "Item",
      amountCents: line.amount,
    })),
    sent,
  };
}

async function requireInvoiceableOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new Error("Order not found");
  }
  if (!isUnpaid(order.status)) {
    throw new Error("Invoices can only be sent for unpaid orders");
  }
  if (isComplimentaryOrder(order.stripeSessionId) || order.amountCents === 0) {
    throw new Error("Complimentary orders cannot be invoiced");
  }
  if (!order.customerEmail) {
    throw new Error("Order is missing a customer email");
  }
  return order;
}

/** Create/finalize a Stripe invoice without emailing the customer. */
export async function prepareStripeInvoiceForOrder(orderId: string) {
  const order = await requireInvoiceableOrder(orderId);
  const stripe = getStripe();
  const sent = Boolean(order.invoiceSentAt);

  if (order.stripeInvoiceId) {
    const existing = await stripe.invoices.retrieve(order.stripeInvoiceId, {
      expand: ["lines"],
    });
    const invoice =
      existing.status === "draft"
        ? await stripe.invoices.finalizeInvoice(existing.id)
        : existing;
    if (!order.invoiceHostedUrl && invoice.hosted_invoice_url) {
      await prisma.order.update({
        where: { id: orderId },
        data: { invoiceHostedUrl: invoice.hosted_invoice_url },
      });
    }
    return {
      order,
      preview: mapInvoicePreview(invoice, sent),
    };
  }

  const taxExempt = await contactTaxExemptForEmail(order.customerEmail);
  const customer = await getOrCreateStripeCustomer(
    order.customerEmail,
    order.customerName ?? order.shippingName,
    taxExempt,
  );

  // Stripe Tax needs a customer address; use the order ship-to when present.
  if (
    order.shippingLine1 &&
    order.shippingCity &&
    order.shippingState &&
    order.shippingPostal
  ) {
    await stripe.customers.update(customer.id, {
      shipping: {
        name: order.shippingName ?? order.customerName ?? customer.name ?? "Customer",
        address: {
          line1: order.shippingLine1,
          line2: order.shippingLine2 ?? undefined,
          city: order.shippingCity,
          state: order.shippingState,
          postal_code: order.shippingPostal,
          country: order.shippingCountry ?? "US",
        },
      },
      address: {
        line1: order.shippingLine1,
        line2: order.shippingLine2 ?? undefined,
        city: order.shippingCity,
        state: order.shippingState,
        postal_code: order.shippingPostal,
        country: order.shippingCountry ?? "US",
      },
    });
  }

  await stripe.invoiceItems.create(
    {
      customer: customer.id,
      amount: order.amountCents,
      currency: "usd",
      description: invoiceDescription(order),
      tax_behavior: "exclusive",
    },
    { idempotencyKey: `bb-invoice-item-${orderId}` },
  );

  const created = await stripe.invoices.create(
    {
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: INVOICE_DUE_DAYS,
      automatic_tax: { enabled: true },
      metadata: {
        order_id: order.id,
        product_id: order.productId ?? BEAN_BOOK_2026.id,
      },
    },
    { idempotencyKey: `bb-invoice-${orderId}` },
  );

  const finalized = await stripe.invoices.finalizeInvoice(
    created.id,
    undefined,
    { idempotencyKey: `bb-invoice-finalize-${orderId}` },
  );
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      stripeInvoiceId: finalized.id,
      invoiceHostedUrl: finalized.hosted_invoice_url ?? null,
    },
  });

  return {
    order: updated,
    preview: mapInvoicePreview(finalized, false),
  };
}

/** Email a previously prepared invoice. Does not send until this is called. */
export async function sendPreparedStripeInvoice(orderId: string) {
  const order = await requireInvoiceableOrder(orderId);
  if (order.invoiceSentAt) {
    throw new Error("An invoice was already sent for this order");
  }

  const stripe = getStripe();
  let invoiceId = order.stripeInvoiceId;
  if (!invoiceId) {
    const prepared = await prepareStripeInvoiceForOrder(orderId);
    invoiceId = prepared.preview.stripeInvoiceId;
  }

  const sent = await stripe.invoices.sendInvoice(invoiceId);
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      stripeInvoiceId: sent.id,
      invoiceHostedUrl: sent.hosted_invoice_url ?? order.invoiceHostedUrl,
      invoiceSentAt: new Date(),
    },
  });

  return {
    order: updated,
    preview: mapInvoicePreview(sent, true),
    hostedInvoiceUrl: sent.hosted_invoice_url,
  };
}

export async function sendStripeInvoiceForOrder(orderId: string) {
  await prepareStripeInvoiceForOrder(orderId);
  return sendPreparedStripeInvoice(orderId);
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
