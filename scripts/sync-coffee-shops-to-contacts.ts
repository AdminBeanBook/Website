/**
 * Import all Coffee shops into Contacts with the "Coffee shop" tag.
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/sync-coffee-shops-to-contacts.ts
 */
import { syncCoffeeShopsToContacts } from "../src/lib/contacts/from-coffee-shops";

async function main() {
  const result = await syncCoffeeShopsToContacts({ activeOnly: true });
  console.log(
    `Synced ${result.total} coffee shops → contacts (${result.created} created, ${result.updated} updated)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
