import { prisma } from "@/lib/db";

export type EmailAudience = "customers" | "contacts" | "custom";

export function parseTagIds(raw?: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export async function resolveRecipients(
  audience: EmailAudience,
  options?: { customEmails?: string; tagIds?: string[] },
): Promise<{ email: string; label?: string }[]> {
  if (audience === "custom") {
    const emails = parseEmailList(options?.customEmails ?? "");
    return emails.map((email) => ({ email }));
  }

  if (audience === "contacts") {
    const tagIds = options?.tagIds ?? [];
    const contacts = await prisma.contact.findMany({
      where: {
        active: true,
        email: { not: null },
        ...(tagIds.length > 0
          ? { tags: { some: { id: { in: tagIds } } } }
          : {}),
      },
      include: { tags: true },
      orderBy: { name: "asc" },
    });

    const seen = new Set<string>();
    const out: { email: string; label?: string }[] = [];
    for (const c of contacts) {
      const email = c.email?.trim().toLowerCase();
      if (!email || !email.includes("@") || seen.has(email)) continue;
      seen.add(email);
      out.push({ email, label: c.name });
    }
    return out;
  }

  const customers = await prisma.customer.findMany({
    orderBy: { email: "asc" },
  });
  const orderEmails = await prisma.order.findMany({
    select: { customerEmail: true, customerName: true },
    distinct: ["customerEmail"],
  });

  const map = new Map<string, string | undefined>();
  for (const c of customers) {
    map.set(c.email.toLowerCase(), c.name ?? undefined);
  }
  for (const o of orderEmails) {
    if (!map.has(o.customerEmail.toLowerCase())) {
      map.set(o.customerEmail.toLowerCase(), o.customerName ?? undefined);
    }
  }

  return [...map.entries()].map(([email, label]) => ({ email, label }));
}

export function parseEmailList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[\n,;]+/)) {
    const email = part.trim().toLowerCase();
    if (!email || !email.includes("@")) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

export async function countRecipients(
  audience: EmailAudience,
  options?: { customEmails?: string; tagIds?: string[] },
): Promise<number> {
  const list = await resolveRecipients(audience, options);
  return list.length;
}
