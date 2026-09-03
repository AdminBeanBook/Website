import { parseLocationsJson } from "@/lib/coffee-shops";
import { prisma } from "@/lib/db";

const COFFEE_SHOP_TAG_SLUG = "coffee-shop";

async function ensureCoffeeShopTag() {
  return prisma.contactTag.upsert({
    where: { slug: COFFEE_SHOP_TAG_SLUG },
    create: {
      name: "Coffee shop",
      slug: COFFEE_SHOP_TAG_SLUG,
      color: "#226932",
    },
    update: {},
  });
}

function shopNotes(shop: {
  website: string;
  locationLabel: string;
  locationsJson: string;
}): string {
  const locations = parseLocationsJson(shop.locationsJson);
  const parts: string[] = [];
  if (shop.website.trim()) parts.push(`Website: ${shop.website.trim()}`);
  if (locations.length) {
    parts.push(`${shop.locationLabel}: ${locations.join(", ")}`);
  }
  return parts.join("\n");
}

/**
 * Import every CoffeeShop as a Contact tagged "Coffee shop".
 * Prefer matching by email, then by name, to avoid duplicates.
 */
export async function syncCoffeeShopsToContacts(options?: {
  activeOnly?: boolean;
}) {
  const tag = await ensureCoffeeShopTag();
  const shops = await prisma.coffeeShop.findMany({
    where: options?.activeOnly === false ? undefined : { active: true },
    orderBy: { name: "asc" },
  });

  const existing = await prisma.contact.findMany({
    include: { tags: { select: { id: true } } },
  });
  const byEmail = new Map(
    existing
      .filter((c) => c.email)
      .map((c) => [c.email!.trim().toLowerCase(), c]),
  );
  const byName = new Map(
    existing.map((c) => [c.name.trim().toLowerCase(), c]),
  );
  const byCompany = new Map(
    existing
      .filter((c) => c.company)
      .map((c) => [c.company!.trim().toLowerCase(), c]),
  );

  let created = 0;
  let updated = 0;

  for (const shop of shops) {
    const name = shop.name.trim();
    if (!name) continue;

    const email = shop.email?.trim().toLowerCase() || null;
    const notes = shopNotes(shop);
    const match =
      (email ? byEmail.get(email) : undefined) ??
      byCompany.get(name.toLowerCase()) ??
      byName.get(name.toLowerCase());

    if (match) {
      const hasTag = match.tags.some((t) => t.id === tag.id);
      const updatedContact = await prisma.contact.update({
        where: { id: match.id },
        data: {
          active: true,
          company: name,
          name: match.name,
          email: email || match.email,
          notes: match.notes?.trim() ? match.notes : notes || null,
          ...(!hasTag ? { tags: { connect: { id: tag.id } } } : {}),
        },
        include: { tags: { select: { id: true } } },
      });
      byName.set(updatedContact.name.trim().toLowerCase(), updatedContact);
      if (updatedContact.company) {
        byCompany.set(
          updatedContact.company.trim().toLowerCase(),
          updatedContact,
        );
      }
      if (updatedContact.email) {
        byEmail.set(updatedContact.email.trim().toLowerCase(), updatedContact);
      }
      updated += 1;
      continue;
    }

    const createdContact = await prisma.contact.create({
      data: {
        company: name,
        name,
        email,
        phone: null,
        notes: notes || null,
        active: true,
        tags: { connect: { id: tag.id } },
      },
      include: { tags: { select: { id: true } } },
    });
    byName.set(name.toLowerCase(), createdContact);
    byCompany.set(name.toLowerCase(), createdContact);
    if (email) byEmail.set(email, createdContact);
    created += 1;
  }

  return { total: shops.length, created, updated };
}
