import { prisma } from "@/lib/db";

const CUSTOMER_TAG_SLUG = "customer";

export type CustomerContactInput = {
  email: string;
  name?: string | null;
  phone?: string | null;
};

async function ensureCustomerTag() {
  return prisma.contactTag.upsert({
    where: { slug: CUSTOMER_TAG_SLUG },
    create: {
      name: "Customer",
      slug: CUSTOMER_TAG_SLUG,
      color: "#7c3aed",
    },
    update: {},
  });
}

/**
 * Upsert a Contact for a Customer email so buyers appear in Contacts.
 * Matches by email (case-insensitive). Tags with the "Customer" tag.
 */
export async function upsertContactFromCustomer(
  input: CustomerContactInput,
) {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return null;

  const tag = await ensureCustomerTag();
  const name =
    input.name?.trim() || email.split("@")[0] || email;
  const phone = input.phone?.trim() || null;

  const existing = await prisma.contact.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { tags: { select: { id: true } } },
  });

  if (existing) {
    const hasTag = existing.tags.some((t) => t.id === tag.id);
    return prisma.contact.update({
      where: { id: existing.id },
      data: {
        active: true,
        name: input.name?.trim() || existing.name,
        phone: phone || existing.phone,
        email,
        ...(!hasTag ? { tags: { connect: { id: tag.id } } } : {}),
      },
    });
  }

  return prisma.contact.create({
    data: {
      name,
      email,
      phone,
      active: true,
      tags: { connect: { id: tag.id } },
    },
  });
}

/** One-time / on-demand: copy every Customer into Contacts. */
export async function syncAllCustomersToContacts() {
  const tag = await ensureCustomerTag();
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "asc" },
  });

  const emails = customers.map((c) => c.email.toLowerCase());
  const existingContacts = await prisma.contact.findMany({
    where: { email: { not: null } },
    include: { tags: { select: { id: true } } },
  });

  const byEmail = new Map(
    existingContacts
      .filter((c) => c.email)
      .map((c) => [c.email!.toLowerCase(), c]),
  );

  let created = 0;
  let updated = 0;

  for (const customer of customers) {
    const email = customer.email.toLowerCase();
    const existing = byEmail.get(email);
    const name =
      customer.name?.trim() || email.split("@")[0] || email;
    const phone = customer.phone?.trim() || null;

    if (existing) {
      const hasTag = existing.tags.some((t) => t.id === tag.id);
      await prisma.contact.update({
        where: { id: existing.id },
        data: {
          active: true,
          name: customer.name?.trim() || existing.name,
          phone: phone || existing.phone,
          email,
          ...(!hasTag ? { tags: { connect: { id: tag.id } } } : {}),
        },
      });
      updated += 1;
      continue;
    }

    const createdContact = await prisma.contact.create({
      data: {
        name,
        email,
        phone,
        active: true,
        tags: { connect: { id: tag.id } },
      },
      include: { tags: { select: { id: true } } },
    });
    byEmail.set(email, createdContact);
    created += 1;
  }

  return { total: customers.length, created, updated };
}
