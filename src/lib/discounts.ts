import { prisma } from "@/lib/db";

export type DiscountValidation =
  | { valid: true; code: string; discountCents: number; type: string; value: number }
  | { valid: false; error: string };

export function computeDiscountCents(
  type: string,
  value: number,
  subtotalCents: number,
): number {
  if (type === "PERCENT") {
    return Math.min(subtotalCents, Math.round((subtotalCents * value) / 100));
  }
  return Math.min(subtotalCents, value);
}

export async function validateDiscountCode(
  rawCode: string | undefined,
  subtotalCents: number,
): Promise<DiscountValidation> {
  if (!rawCode?.trim()) {
    return { valid: false, error: "No code provided" };
  }

  const code = rawCode.trim().toUpperCase();
  const record = await prisma.discountCode.findUnique({ where: { code } });

  if (!record || !record.active) {
    return { valid: false, error: "Invalid discount code" };
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return { valid: false, error: "This code has expired" };
  }

  if (record.maxUses != null && record.usedCount >= record.maxUses) {
    return { valid: false, error: "This code has reached its usage limit" };
  }

  const discountCents = computeDiscountCents(
    record.type,
    record.value,
    subtotalCents,
  );

  return {
    valid: true,
    code: record.code,
    discountCents,
    type: record.type,
    value: record.value,
  };
}

export async function incrementDiscountUsage(code: string) {
  await prisma.discountCode.update({
    where: { code },
    data: { usedCount: { increment: 1 } },
  });
}
