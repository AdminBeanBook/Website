import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/** Vercel/env files sometimes include wrapping quotes — strip before Prisma reads them. */
function sanitizeDatabaseEnv() {
  for (const key of ["DATABASE_URL", "DIRECT_URL"] as const) {
    const value = process.env[key];
    if (value) {
      process.env[key] = value.trim().replace(/^["']|["']$/g, "");
    }
  }
}

sanitizeDatabaseEnv();

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

const databaseUrl = resolveDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
