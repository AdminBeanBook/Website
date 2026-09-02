import { prisma } from "@/lib/db";

export async function contactTaxExemptForEmail(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes("@")) return false;

  const contact = await prisma.contact.findFirst({
    where: { email: { equals: normalized, mode: "insensitive" } },
    select: { taxExempt: true },
  });
  return Boolean(contact?.taxExempt);
}
