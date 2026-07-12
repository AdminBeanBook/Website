import { upsertContactFromCustomer } from "@/lib/contacts/from-customer";
import { prisma } from "@/lib/db";
import { sendStripeInvoiceForOrder } from "@/lib/orders/invoice";
import { resolveProduct } from "@/lib/products";

export type CreateManualOrderInput = {
  productId?: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  quantity?: number;
  shippingName?: string;
  shippingLine1?: string;
  shippingLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingPostal?: string;
  shippingCountry?: string;
  notes?: string;
  sendInvoice?: boolean;
};

export async function createManualOrder(input: CreateManualOrderInput) {
  const email = input.customerEmail.trim().toLowerCase();
  if (!email) {
    throw new Error("Customer email is required");
  }

  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1));
  const product = await resolveProduct(input.productId);
  const amountCents = product.priceCents * quantity;

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
  });

  const order = await prisma.order.create({
    data: {
      stripeSessionId: `manual_${crypto.randomUUID()}`,
      status: "unpaid",
      amountCents,
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

  if (input.sendInvoice) {
    const invoiced = await sendStripeInvoiceForOrder(order.id);
    return invoiced.order;
  }

  return order;
}
