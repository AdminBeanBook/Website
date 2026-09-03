import { PrismaClient } from "@prisma/client";

const url = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "")
  .trim()
  .replace(/^["']|["']$/g, "");

const prisma = new PrismaClient({
  datasources: { db: { url } },
});

async function main() {
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "company" TEXT`,
  );

  const filled = await prisma.$executeRawUnsafe(`
    UPDATE "Contact" AS c
    SET "company" = c.name
    WHERE (c.company IS NULL OR c.company = '')
      AND EXISTS (
        SELECT 1
        FROM "_ContactToContactTag" AS j
        JOIN "ContactTag" AS t ON t.id = j."B"
        WHERE j."A" = c.id AND t.slug = 'coffee-shop'
      )
  `);

  console.log(`Contact.company column ready (filled ${String(filled)} coffee shops)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
