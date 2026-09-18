import { upsertContactFromCustomer } from "@/lib/contacts/from-customer";
import { prisma } from "@/lib/db";
import { sendStripeInvoiceForOrder } from "@/lib/orders/invoice";
import { notifyNewOrderEmail } from "@/lib/notifications/order-email";
import { resolveProduct } from "@/lib/products";

export type CreateManualOrderInput = {
  productId?: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  quantity?: number;
  /** Optional percent off (0–100). Ignored for complimentary orders. */
  discountPercent?: number;
  shippingName?: string;
  shippingLine1?: string;
  shippingLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostal?: string;
  shippingCountry?: string;
  notes?: string;
  sendInvoice?: boolean;
  complimentary?: boolean;
};

export async function createManualOrder(input: CreateManualOrderInput) {
  const email = input.customerEmail.trim().toLowerCase();
  if (!email) {
    throw new Error("Customer email is required");
  }

  const complimentary = Boolean(input.complimentary);
  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1));
  const product = await resolveProduct(input.productId);
  const listCents = product.priceCents * quantity;

  const rawPercent = Number(input.discountPercent);
  const discountPercent = complimentary
    ? 0
    : Number.isFinite(rawPercent)
      ? Math.min(100, Math.max(0, rawPercent))
      : 0;
  const discountCents = complimentary
    ? listCents
    : Math.min(
        listCents,
        Math.round((listCents * discountPercent) / 100),
      );
  const amountCents = complimentary ? 0 : Math.max(0, listCents - discountCents);
  const discountCode = complimentary
    ? "COMPLIMENTARY"
    : discountPercent > 0
      ? `${formatDiscountPercent(discountPercent)}% OFF`
      : null;

  if (complimentary) {
    const shipReady = Boolean(
      input.shippingName?.trim() &&
        input.shippingLine1?.trim() &&
        input.shippingCity?.trim() &&
        input.shippingState?.trim() &&
        input.shippingPostal?.trim(),
    );
    if (!shipReady) {
      throw new Error(
        "Complimentary orders need a complete shipping address so you can mail the book",
      );
    }
  }

  const customer = await prisma.customer.upsert({
    where: { email },
    create: {
      email,
      name: input.customerName?.trim() || null,
      phone: input.customerPhone?.trim() || null,
    },
    update: {
      name: input.customerName?.trim() || undefined,
      phone: input.customerPhone?.trim() || undefined,
    },
  });

  await upsertContactFromCustomer({
    email,
    name: customer.name,
    phone: customer.phone,
    address: {
      addressName: input.shippingName,
      addressLine1: input.shippingLine1,
      addressLine2: input.shippingLine2,
      addressCity: input.shippingCity,
      addressState: input.shippingState,
      addressPostal: input.shippingPostal,
      addressCountry: input.shippingCountry,
    },
  });

  const order = await prisma.order.create({
    data: {
      stripeSessionId: complimentary
        ? `manual_comp_${crypto.randomUUID()}`
        : `manual_${crypto.randomUUID()}`,
      status: complimentary ? "paid" : "unpaid",
      amountCents,
      discountCents,
      discountCode,
      productId: product.id,
      customerId: customer.id,
      customerEmail: email,
      customerName: input.customerName?.trim() || null,
      customerPhone: input.customerPhone?.trim() || null,
      shippingName: input.shippingName?.trim() || null,
      shippingLine1: input.shippingLine1?.trim() || null,
      shippingLine2: input.shippingLine2?.trim() || null,
      shippingCity: input.shippingCity?.trim() || null,
      shippingState: input.shippingState?.trim() || null,
      shippingPostal: input.shippingPostal?.trim() || null,
      shippingCountry: input.shippingCountry?.trim() || "US",
      notes: input.notes?.trim() || null,
    },
  });

  if (complimentary) {
    void notifyNewOrderEmail(order);
    return order;
  }

  if (input.sendInvoice) {
    const invoiced = await sendStripeInvoiceForOrder(order.id);
    return invoiced.order;
  }

  return order;
}

function formatDiscountPercent(percent: number): string {
  return Number.isInteger(percent)
    ? String(percent)
    : percent.toFixed(2).replace(/\.?0+$/, "");
}
