/**
 * Manually import a completed Stripe checkout into the admin database.
 * Usage: npx dotenv -e .env.local -- npx tsx scripts/sync-stripe-order.ts cs_test_xxxxx
 */
import { syncOrderFromCheckoutSession } from "../src/lib/sync-order";

const sessionId = process.argv[2];

if (!sessionId?.startsWith("cs_")) {
  console.error("Usage: npx dotenv -e .env.local -- npx tsx scripts/sync-stripe-order.ts cs_test_...");
  process.exit(1);
}

syncOrderFromCheckoutSession(sessionId)
  .then((order) => {
    if (order) {
      console.log("Order synced:", order.id, order.customerEmail);
    } else {
      console.log("No order saved (session not paid or missing email).");
    }
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
