import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import path from "path";
import { PAGE_DEFAULTS } from "../src/lib/page-defaults";
import { BEAN_BOOK_2026 } from "../src/lib/products";
import { DEFAULT_SITE_CONFIG, SITE_SETTINGS_ID } from "../src/lib/site-config/defaults";
import { getDefaultSenders } from "../src/lib/email/senders";
import { locationsToJson } from "../src/lib/coffee-shops";
import { COFFEE_SHOPS } from "../src/data/coffee-shops";

function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("file:")) return url;

  const filePath = url.slice("file:".length).replace(/^["']|["']$/g, "");
  if (filePath === "./dev.db" || filePath === "dev.db") {
    return `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
  }

  return `file:${filePath}`;
}

const prisma = new PrismaClient({
  datasources: { db: { url: resolveDatabaseUrl() } },
});

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@thebeanbook.org";
  const password = process.env.ADMIN_PASSWORD ?? "beanbook-admin";

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 12);

  if (!existing) {
    await prisma.adminUser.create({ data: { email, passwordHash } });
    console.log(`Admin user created: ${email}`);
  } else {
    await prisma.adminUser.update({
      where: { email },
      data: { passwordHash },
    });
    console.log(`Admin password synced from ADMIN_PASSWORD for: ${email}`);
  }

  const defaultPackage = await prisma.packagePreset.findFirst({
    where: { isDefault: true },
  });
  if (!defaultPackage) {
    const count = await prisma.packagePreset.count();
    await prisma.packagePreset.create({
      data: {
        name: "Bean Book bubble mailer",
        lengthIn: Number(process.env.PACKAGE_LENGTH_IN ?? 10),
        widthIn: Number(process.env.PACKAGE_WIDTH_IN ?? 8),
        heightIn: Number(process.env.PACKAGE_HEIGHT_IN ?? 1),
        weightOz: Number(process.env.PACKAGE_WEIGHT_OZ ?? 13),
        isDefault: count === 0,
      },
    });
    console.log("Default shipping package preset created.");
  }

  await prisma.product.upsert({
    where: { id: BEAN_BOOK_2026.id },
    create: {
      id: BEAN_BOOK_2026.id,
      name: BEAN_BOOK_2026.name,
      description: BEAN_BOOK_2026.description,
      priceCents: BEAN_BOOK_2026.priceCents,
      imageUrl: BEAN_BOOK_2026.imageUrl,
      active: true,
    },
    update: {},
  });
  console.log("Catalog product seeded (existing edits preserved).");

  const siteJson = JSON.stringify(DEFAULT_SITE_CONFIG);
  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: {
      id: SITE_SETTINGS_ID,
      publishedConfig: siteJson,
      draftConfig: siteJson,
      publishedAt: new Date(),
      draftUpdatedAt: new Date(),
    },
    update: {},
  });

  for (const page of PAGE_DEFAULTS) {
    await prisma.pageContent.upsert({
      where: { slug: page.slug },
      create: {
        slug: page.slug,
        path: page.path,
        template: page.template,
        enabled: true,
        showInNav: page.showInNav,
        sortOrder: page.sortOrder,
        isSystem: page.isSystem,
        title: page.title,
        subtitle: page.subtitle ?? null,
        body: page.body,
        draftTitle: page.title,
        draftSubtitle: page.subtitle ?? null,
        draftBody: page.body,
        draftPath: page.path,
        draftTemplate: page.template,
        draftEnabled: true,
        draftShowInNav: page.showInNav,
        draftUpdatedAt: new Date(),
      },
      update: {},
    });
  }
  console.log("Site settings and pages seeded (existing edits preserved).");

  await prisma.emailSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      sendersJson: JSON.stringify(getDefaultSenders()),
    },
    update: {
      sendersJson: JSON.stringify(getDefaultSenders()),
    },
  });

  const defaultTags = [
    { name: "Coffee shop", slug: "coffee-shop", color: "#226932" },
    { name: "Partner", slug: "partner", color: "#c4a574" },
    { name: "Press", slug: "press", color: "#1e3a5f" },
    { name: "Customer", slug: "customer", color: "#7c3aed" },
  ];
  for (const tag of defaultTags) {
    await prisma.contactTag.upsert({
      where: { slug: tag.slug },
      create: tag,
      update: {},
    });
  }
  console.log("Contact tags seeded (existing tags preserved).");

  const shopCount = await prisma.coffeeShop.count();
  if (shopCount === 0) {
    for (let i = 0; i < COFFEE_SHOPS.length; i++) {
      const shop = COFFEE_SHOPS[i];
      await prisma.coffeeShop.create({
        data: {
          name: shop.name,
          website: shop.website,
          locationLabel: shop.locationLabel ?? "Location",
          locationsJson: locationsToJson(shop.locations),
          sortOrder: i,
          active: true,
        },
      });
    }
    console.log(`Coffee shops seeded (${COFFEE_SHOPS.length} shops).`);
  } else {
    console.log("Coffee shops already in database (skipped seed import).");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
