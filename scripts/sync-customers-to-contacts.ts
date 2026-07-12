/**
 * One-time: copy every Customer into Contacts (tagged "Customer").
 *
 * Usage:
 *   npx dotenv -e .env.local -- npx tsx scripts/sync-customers-to-contacts.ts
 */
import { syncAllCustomersToContacts } from "../src/lib/contacts/from-customer";

async function main() {
  const result = await syncAllCustomersToContacts();
  console.log(
    `Synced ${result.total} customers → contacts (${result.created} created, ${result.updated} updated)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
