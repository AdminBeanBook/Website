import type { DiscountCode } from "@prisma/client";
import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe } from "@/lib/stripe";

type DiscountRecord = Pick<
  DiscountCode,
  | "id"
  | "code"
  | "type"
  | "value"
  | "active"
  | "maxUses"
  | "expiresAt"
  | "stripeCouponId"
  | "stripePromotionCodeId"
>;

function promotionCodeParams(
  record: Pick<DiscountCode, "code" | "active" | "maxUses" | "expiresAt">,
  couponId: string,
): Stripe.PromotionCodeCreateParams {
  return {
    coupon: couponId,
    code: record.code,
    active: record.active,
    ...(record.maxUses != null ? { max_redemptions: record.maxUses } : {}),
    ...(record.expiresAt
      ? { expires_at: Math.floor(record.expiresAt.getTime() / 1000) }
      : {}),
  };
}

async function createCouponAndPromotion(
  record: DiscountRecord,
): Promise<DiscountCode> {
  const stripe = getStripe();

  const couponParams: Stripe.CouponCreateParams = {
    duration: "once",
    name: record.code,
    ...(record.type === "PERCENT"
      ? { percent_off: record.value }
      : { amount_off: record.value, currency: "usd" }),
  };

  const coupon = await stripe.coupons.create(couponParams);
  const promotionCode = await stripe.promotionCodes.create(
    promotionCodeParams(record, coupon.id),
  );

  return prisma.discountCode.update({
    where: { id: record.id },
    data: {
      stripeCouponId: coupon.id,
      stripePromotionCodeId: promotionCode.id,
    },
  });
}

/**
 * Ensure a discount exists as a Stripe Promotion Code on the current Stripe account.
 * If stored IDs belong to an old account (or are missing), creates new coupon + promo.
 */
export async function syncDiscountToStripe(
  record: DiscountRecord,
  options?: { forceRecreate?: boolean },
): Promise<DiscountCode> {
  const stripe = getStripe();

  if (record.stripePromotionCodeId && !options?.forceRecreate) {
    try {
      await stripe.promotionCodes.update(record.stripePromotionCodeId, {
        active: record.active,
      });
      return record as DiscountCode;
    } catch {
      // IDs from a previous Stripe account — recreate below.
    }
  }

  return createCouponAndPromotion(record);
}

/** Re-create every discount code on the current Stripe account (e.g. after switching accounts). */
export async function resyncAllDiscountsToStripe() {
  const codes = await prisma.discountCode.findMany({
    orderBy: { createdAt: "asc" },
  });

  let synced = 0;
  const errors: string[] = [];

  for (const code of codes) {
    try {
      await syncDiscountToStripe(code, { forceRecreate: true });
      synced += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(`${code.code}: ${message}`);
    }
  }

  return { total: codes.length, synced, errors };
}

export async function deactivateStripePromotion(
  stripePromotionCodeId: string | null | undefined,
) {
  if (!stripePromotionCodeId) return;

  const stripe = getStripe();
  try {
    await stripe.promotionCodes.update(stripePromotionCodeId, { active: false });
  } catch {
    // Ignore — code may belong to a previous Stripe account.
  }
}
