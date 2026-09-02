import {
  addressFromShipping,
  normalizeContactAddress,
  type ContactAddress,
} from "@/lib/contacts/address";
import { prisma } from "@/lib/db";

const CUSTOMER_TAG_SLUG = "customer";

export type CustomerContactInput = {
  email: string;
  name?: string | null;
  phone?: string | null;
  address?: Partial<ContactAddress> | null;
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

export async function latestOrderAddressForEmail(email: string) {
  const order = await prisma.order.findFirst({
    where: {
      customerEmail: { equals: email, mode: "insensitive" },
      NOT: { OR: [{ shippingLine1: null }, { shippingLine1: "" }] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      shippingName: true,
      shippingLine1: true,
      shippingLine2: true,
      shippingCity: true,
      shippingState: true,
      shippingPostal: true,
      shippingCountry: true,
    },
  });
  return addressFromShipping(order);
}

/**
 * Upsert a Contact for a Customer email so buyers appear in Contacts.
 * Matches by email (case-insensitive). Tags with the "Customer" tag.
 * Copies shipping address from the order when provided, or the latest order.
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
  const incoming = normalizeContactAddress(input.address);

  const existing = await prisma.contact.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    include: { tags: { select: { id: true } } },
  });

  if (existing) {
    const hasTag = existing.tags.some((t) => t.id === tag.id);
    const address =
      incoming ??
      (existing.addressLine1?.trim()
        ? null
        : await latestOrderAddressForEmail(email));
    return prisma.contact.update({
      where: { id: existing.id },
      data: {
        active: true,
        name: input.name?.trim() || existing.name,
        phone: phone || existing.phone,
        email,
        ...(address ?? {}),
        ...(!hasTag ? { tags: { connect: { id: tag.id } } } : {}),
      },
    });
  }

  const address = incoming ?? (await latestOrderAddressForEmail(email));
  return prisma.contact.create({
    data: {
      name,
      email,
      phone,
      active: true,
      ...(address ?? {}),
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
    const address = await latestOrderAddressForEmail(email);

    if (existing) {
      const hasTag = existing.tags.some((t) => t.id === tag.id);
      await prisma.contact.update({
        where: { id: existing.id },
        data: {
          active: true,
          name: customer.name?.trim() || existing.name,
          phone: phone || existing.phone,
          email,
          ...(address && !existing.addressLine1?.trim() ? address : {}),
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
        ...(address ?? {}),
        tags: { connect: { id: tag.id } },
      },
      include: { tags: { select: { id: true } } },
    });
    byEmail.set(email, createdContact);
    created += 1;
  }

  return { total: customers.length, created, updated };
}
