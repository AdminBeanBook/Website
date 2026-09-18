import { PrismaClient } from "@prisma/client";

const url = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "")
  .trim()
  .replace(/^["']|["']$/g, "");

const prisma = new PrismaClient({
  datasources: { db: { url } },
});

async function main() {
  await prisma.$executeRawUnsafe(`
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "labelPrintedAt" TIMESTAMP(3);
`);
  console.log('Order.labelPrintedAt column ready');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
