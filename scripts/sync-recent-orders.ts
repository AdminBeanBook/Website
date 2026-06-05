import { getStripe } from "../src/lib/stripe";
import { syncOrderFromCheckoutSession } from "../src/lib/sync-order";

async function main() {
  const stripe = getStripe();
  const sessions = await stripe.checkout.sessions.list({
    limit: 10,
    status: "complete",
  });

  if (sessions.data.length === 0) {
    console.log("No completed checkout sessions found in Stripe.");
    return;
  }

  for (const session of sessions.data) {
    const order = await syncOrderFromCheckoutSession(session.id);
    console.log(
      session.id,
      session.customer_details?.email ?? "no email",
      order ? `→ synced (${order.id})` : "→ skipped",
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
