import { NextResponse } from "next/server";
import Stripe from "stripe";
import { BEAN_BOOK_2026 } from "@/lib/products";
import { captureServerError } from "@/lib/sentry/capture";
import { getSiteOriginFromRequest, getStripe } from "@/lib/stripe";

/** Stripe Tax code: physical books / printed materials. */
const BOOK_TAX_CODE = "txcd_35010000";

export async function POST(request: Request) {
  try {
    const stripe = getStripe();
    const origin = getSiteOriginFromRequest(request);
    const shippingCents = Number(process.env.SHIPPING_AMOUNT_CENTS ?? "0");

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      process.env.STRIPE_PRICE_ID
        ? [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }]
        : [
            {
              quantity: 1,
              price_data: {
                currency: BEAN_BOOK_2026.currency,
                unit_amount: BEAN_BOOK_2026.priceCents,
                tax_behavior: "exclusive",
                product_data: {
                  name: BEAN_BOOK_2026.name,
                  description: BEAN_BOOK_2026.description,
                  images: [BEAN_BOOK_2026.imageUrl],
                  tax_code: BOOK_TAX_CODE,
                },
              },
            },
          ];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "payment",
      line_items: lineItems,
      allow_promotion_codes: true,
      automatic_tax: { enabled: true },
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
            tax_behavior: "exclusive",
          },
        },
      ];
    }

    // New Stripe accounts enable Managed Payments by default (digital-only).
    // Physical books need shipping addresses, so disable it for this session.
    const session = await stripe.checkout.sessions.create({
      ...sessionParams,
      managed_payments: { enabled: false },
    } as Stripe.Checkout.SessionCreateParams);

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
