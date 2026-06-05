/**
 * Import historical orders from Shopify CSV exports.
 *
 * Supported formats:
 * - Orders export: Shopify Admin → Orders → Export → Orders
 * - Transactions export: Shopify Admin → Orders → Export → Transactions
 *
 * Usage:
 *   npm run import-orders -- ./path/to/export.csv
 *   npm run import-orders -- ./export.csv --dry-run
 */
import fs from "fs";
import path from "path";
import { importOrders, parseImportCsv } from "../src/lib/orders/import";

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--");
  const dryRun = args.includes("--dry-run");
  const fileArg = args.find((a) => !a.startsWith("--"));

  if (!fileArg) {
    console.error(
      "Usage: npm run import-orders -- <path-to-shopify-export.csv> [--dry-run]",
    );
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const csv = fs.readFileSync(filePath, "utf8");
  const { format, rows } = parseImportCsv(csv);

  if (rows.length === 0) {
    console.error(`No orders found (detected format: ${format}).`);
    console.error("");
    console.error("Supported Shopify exports:");
    console.error("  · Orders → Export → Orders (includes customer email & shipping)");
    console.error("  · Orders → Export → Transactions (payments only — no emails)");
    process.exit(1);
  }

  console.log(
    `Detected ${format === "shopify_transactions" ? "Shopify transactions" : "Shopify orders"} export`,
  );
  console.log(`Parsed ${rows.length} orders from ${path.basename(filePath)}`);

  if (format === "shopify_transactions") {
    console.log(
      "Note: Transactions export has no customer emails. Placeholder addresses like order-123@legacy.import are used.",
    );
    console.log(
      "For real emails/shipping, also export Orders (CSV) and run that file.",
    );
  }

  if (dryRun) {
    console.log("Dry run — no database writes.");
    console.log("Sample:", JSON.stringify(rows[0], null, 2));
  }

  const result = await importOrders(rows, { dryRun });
  console.log(`${dryRun ? "Would create" : "Created"}: ${result.created}`);
  console.log(`Skipped (already imported): ${result.skipped}`);
  if (result.errors.length > 0) {
    console.log("Errors:");
    result.errors.forEach((e) => console.log(`  - ${e}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
