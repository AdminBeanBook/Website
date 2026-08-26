#!/usr/bin/env node
/**
 * Ensures the temporary shop-portal super-admin exists on the website DB.
 *
 *   node scripts/ensure-shop-partner-admin.mjs
 *
 * Login: https://…/partners/login
 * Email: adminjoja@gmail.com
 * Password: 123456
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const email = "adminjoja@gmail.com";
const password = "123456";

async function main() {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.shopPartnerUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      name: "Shop Portal Admin",
      role: "shop_super_admin",
      active: true,
    },
    update: {
      passwordHash,
      role: "shop_super_admin",
      active: true,
      name: "Shop Portal Admin",
    },
  });

  console.log("Partner super-admin ready:", user.email);
  console.log("Sign in at /partners/login with", email, "/", password);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  process.exit(1);
});
