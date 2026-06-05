import { saveOrderFromStripeSession } from "@/lib/orders";
import { getStripe } from "@/lib/stripe";

/** Save a paid checkout session to the database (idempotent). */
export async function syncOrderFromCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return null;
  }

  return saveOrderFromStripeSession(session);
}
