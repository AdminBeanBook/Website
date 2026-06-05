import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/** Prisma CLI resolves `file:./dev.db` next to schema.prisma; Next.js uses cwd. */
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return url;

  const filePath = url.slice("file:".length).replace(/^["']|["']$/g, "");
  if (filePath === "./dev.db" || filePath === "dev.db") {
    return `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
  }

  return `file:${filePath}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
