import type Stripe from "stripe";
import { upsertContactFromCustomer } from "@/lib/contacts/from-customer";
import { prisma } from "@/lib/db";
import { incrementDiscountUsage } from "@/lib/discounts";
import { notifyNewOrderEmail } from "@/lib/notifications/order-email";
import { getStripe } from "@/lib/stripe";

function extractPromotionCode(
  session: Stripe.Checkout.Session,
): string | null {
  for (const discount of session.discounts ?? []) {
    const promo = discount.promotion_code;
    if (promo && typeof promo === "object" && "code" in promo && promo.code) {
      return promo.code.toUpperCase();
    }
  }
  return null;
}

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

  const stripe = getStripe();
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["discounts.promotion_code"],
  });

  const shipping = fullSession.shipping_details;
  const address = shipping?.address;
  const discountCents = fullSession.total_details?.amount_discount ?? 0;
  const discountCode = extractPromotionCode(fullSession);

  const customer = await prisma.customer.upsert({
    where: { email },
    create: {
      email,
      name: fullSession.customer_details?.name ?? shipping?.name ?? null,
      phone: fullSession.customer_details?.phone ?? null,
    },
    update: {
      name: fullSession.customer_details?.name ?? shipping?.name ?? undefined,
      phone: fullSession.customer_details?.phone ?? undefined,
    },
  });

  await upsertContactFromCustomer({
    email,
    name: customer.name,
    phone: customer.phone,
  });

  const order = await prisma.order.create({
    data: {
      stripeSessionId: fullSession.id,
      status: "paid",
      amountCents: fullSession.amount_total ?? 0,
      discountCents,
      discountCode,
      productId: fullSession.metadata?.product_id ?? null,
      customerId: customer.id,
      customerEmail: email,
      customerName: fullSession.customer_details?.name ?? shipping?.name ?? null,
      customerPhone: fullSession.customer_details?.phone ?? null,
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

  void notifyNewOrderEmail(order);

  return order;
}
