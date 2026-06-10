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

export async function syncDiscountToStripe(
  record: DiscountRecord,
): Promise<DiscountCode> {
  const stripe = getStripe();

  if (record.stripePromotionCodeId) {
    await stripe.promotionCodes.update(record.stripePromotionCodeId, {
      active: record.active,
    });
    return record as DiscountCode;
  }

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

export async function deactivateStripePromotion(
  stripePromotionCodeId: string | null | undefined,
) {
  if (!stripePromotionCodeId) return;

  const stripe = getStripe();
  await stripe.promotionCodes.update(stripePromotionCodeId, { active: false });
}
