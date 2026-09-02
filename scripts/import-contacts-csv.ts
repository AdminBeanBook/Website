import { readFileSync } from "fs";
import { importContactsFromCsv } from "../src/lib/contacts/import-csv";

const filePath =
  process.argv[2] ??
  "/Users/johnrawson/Downloads/customers_export.csv";

async function main() {
  const csv = readFileSync(filePath, "utf8");
  const result = await importContactsFromCsv(csv);
  console.log(
    JSON.stringify(
      {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors.slice(0, 10),
        errorCount: result.errors.length,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
