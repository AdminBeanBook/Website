import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { incrementDiscountUsage } from "@/lib/discounts";

export async function saveOrderFromStripeSession(
  session: Stripe.Checkout.Session,
) {
  const email =
    session.customer_details?.email ?? session.customer_email ?? null;
  if (!email) {
    console.warn("Stripe session missing customer email:", session.id);
    return null;
  }

  const existing = await prisma.order.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing) return existing;

  const shipping = session.shipping_details;
  const address = shipping?.address;
  const discountCode = session.metadata?.discount_code?.toUpperCase() || null;
  const discountCents = Number(session.metadata?.discount_cents ?? 0);

  const customer = await prisma.customer.upsert({
    where: { email },
    create: {
      email,
      name: session.customer_details?.name ?? shipping?.name ?? null,
      phone: session.customer_details?.phone ?? null,
    },
    update: {
      name: session.customer_details?.name ?? shipping?.name ?? undefined,
      phone: session.customer_details?.phone ?? undefined,
    },
  });

  const order = await prisma.order.create({
    data: {
      stripeSessionId: session.id,
      status: "paid",
      amountCents: session.amount_total ?? 0,
      discountCents,
      discountCode,
      productId: session.metadata?.product_id ?? null,
      customerId: customer.id,
      customerEmail: email,
      customerName: session.customer_details?.name ?? shipping?.name ?? null,
      customerPhone: session.customer_details?.phone ?? null,
      shippingName: shipping?.name ?? null,
      shippingLine1: address?.line1 ?? null,
      shippingLine2: address?.line2 ?? null,
      shippingCity: address?.city ?? null,
      shippingState: address?.state ?? null,
      shippingPostal: address?.postal_code ?? null,
      shippingCountry: address?.country ?? "US",
    },
  });

  if (discountCode) {
    try {
      await incrementDiscountUsage(discountCode);
    } catch (err) {
      console.error("Failed to increment discount usage:", err);
    }
  }

  return order;
}
