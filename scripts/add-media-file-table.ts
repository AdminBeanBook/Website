import { PrismaClient } from "@prisma/client";

const url = (process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "")
  .trim()
  .replace(/^["']|["']$/g, "");

const prisma = new PrismaClient({
  datasources: { db: { url } },
});

async function main() {
  await prisma.$executeRawUnsafe(`
CREATE TABLE IF NOT EXISTS "MediaFile" (
  "id" TEXT NOT NULL,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
);
`);
  await prisma.$executeRawUnsafe(`
CREATE UNIQUE INDEX IF NOT EXISTS "MediaFile_filename_key" ON "MediaFile"("filename");
`);
  console.log("MediaFile table ready");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
