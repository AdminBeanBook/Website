import { NextResponse } from "next/server";
import Stripe from "stripe";
import { validateDiscountCode } from "@/lib/discounts";
import { BEAN_BOOK_2026 } from "@/lib/products";
import { captureServerError } from "@/lib/sentry/capture";
import { getSiteOrigin, getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const origin = getSiteOrigin();
    const shippingCents = Number(process.env.SHIPPING_AMOUNT_CENTS ?? "0");

    let discountCode: string | undefined;
    try {
      const body = (await request.json()) as { discountCode?: string };
      discountCode = body.discountCode;
    } catch {
      discountCode = undefined;
    }

    const subtotalCents = BEAN_BOOK_2026.priceCents;
    let discountCents = 0;
    let appliedCode: string | null = null;

    if (discountCode?.trim()) {
      const result = await validateDiscountCode(discountCode, subtotalCents);
      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      discountCents = result.discountCents;
      appliedCode = result.code;
    }

    const unitAmount = Math.max(50, subtotalCents - discountCents);

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      !appliedCode && process.env.STRIPE_PRICE_ID
        ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: BEAN_BOOK_2026.currency,
                unit_amount: unitAmount,
                product_data: {
                  name: BEAN_BOOK_2026.name,
                  description: appliedCode
                    ? `${BEAN_BOOK_2026.description} (Discount: ${appliedCode})`
                    : BEAN_BOOK_2026.description,
                  images: [BEAN_BOOK_2026.imageUrl],
                },
              },
            },
          ];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      phone_number_collection: {
        enabled: true,
      },
      metadata: {
        product_id: BEAN_BOOK_2026.id,
        discount_code: appliedCode ?? "",
        discount_cents: String(discountCents),
      },
    };

    if (shippingCents > 0) {
      sessionParams.shipping_options = [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingCents,
              currency: "usd",
            },
            display_name: "Standard shipping",
          },
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      return NextResponse.json(
        { error: "Could not start checkout" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    captureServerError(err, { tags: { area: "checkout" } });
    const message =
      err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
