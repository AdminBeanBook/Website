import { PrismaClient } from "@prisma/client";

const url = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "")
  .trim()
  .replace(/^["']|["']$/g, "");

const prisma = new PrismaClient({
  datasources: { db: { url } },
});

async function main() {
  await prisma.$executeRawUnsafe(`
CREATE TABLE IF NOT EXISTS "EmailDraft" (
  "id" TEXT NOT NULL,
  "subject" TEXT NOT NULL DEFAULT '',
  "htmlBody" TEXT NOT NULL DEFAULT '',
  "senderKey" TEXT NOT NULL DEFAULT 'customers',
  "audience" TEXT,
  "customEmails" TEXT NOT NULL DEFAULT '',
  "tagIdsJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EmailDraft_pkey" PRIMARY KEY ("id")
);
`);
  console.log("EmailDraft table ready");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
