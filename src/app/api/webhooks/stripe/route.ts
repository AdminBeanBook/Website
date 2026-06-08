import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  markOrderPaidFromInvoice,
  resolveOrderIdFromInvoice,
} from "@/lib/orders/invoice";
import { saveOrderFromStripeSession } from "@/lib/orders";
import { captureServerError } from "@/lib/sentry/capture";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 },
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await saveOrderFromStripeSession(session);
        break;
      }
      case "checkout.session.expired": {
        console.info("Checkout expired:", event.data.object.id);
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const orderId = await resolveOrderIdFromInvoice({
          id: invoice.id,
          metadata: invoice.metadata ?? null,
        });
        if (!orderId) {
          console.warn(`invoice.paid: no matching order for ${invoice.id}`);
          break;
        }
        const updated = await markOrderPaidFromInvoice(orderId, invoice.id, {
          status: invoice.status,
          amount_paid: invoice.amount_paid,
        });
        if (updated) {
          console.info(
            `invoice.paid: order ${orderId} → ${updated.status} ($${((invoice.amount_paid ?? 0) / 100).toFixed(2)})`,
          );
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    captureServerError(err, {
      tags: { area: "stripe-webhook", event: event.type },
      extra: { eventId: event.id },
    });
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
