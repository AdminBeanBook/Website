import { prisma } from "@/lib/db";
import { captureServerError } from "@/lib/sentry/capture";
import { isShippoConfigured } from "@/lib/shipping/config";
import {
  buyLabelForOrder,
  fetchRatesForOrder,
  orderHasShipToAddress,
} from "@/lib/shipping/orders";
import type { ShippingRateOption } from "@/lib/shipping/shippo";
import { BEAN_BOOK_2027, isPreorderProduct } from "@/lib/products/catalog";
import { resolveProduct } from "@/lib/products";

/** Default on. Set AUTO_BUY_SHIPPING_LABELS=0 to disable. */
export function isAutoBuyLabelsEnabled(): boolean {
  const raw = process.env.AUTO_BUY_SHIPPING_LABELS?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off" || raw === "no") {
    return false;
  }
  return true;
}

function pickBestRate(rates: ShippingRateOption[]): ShippingRateOption | null {
  if (rates.length === 0) return null;

  const groundAdvantage = rates.find((rate) => {
    const service = rate.service.toLowerCase();
    const provider = rate.provider.toLowerCase();
    return (
      service.includes("ground advantage") ||
      (provider.includes("usps") &&
        service.includes("ground") &&
        !service.includes("priority"))
    );
  });
  if (groundAdvantage) return groundAdvantage;

  const uspsCheapest = rates.find((rate) =>
    rate.provider.toLowerCase().includes("usps"),
  );
  if (uspsCheapest) return uspsCheapest;

  // Rates are already sorted cheapest-first.
  return rates[0] ?? null;
}

/**
 * Buy a Shippo label for a paid order so the Mac print agent can print it.
 * Safe to call from webhooks: failures are logged, not thrown to the caller.
 */
export async function maybeAutoBuyLabelForOrder(
  orderId: string,
): Promise<{ ok: boolean; skipped?: string; error?: string }> {
  if (!isAutoBuyLabelsEnabled()) {
    return { ok: false, skipped: "auto-buy disabled" };
  }
  if (!isShippoConfigured()) {
    return { ok: false, skipped: "shippo not configured" };
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return { ok: false, skipped: "order not found" };
    }
    if (order.labelUrl) {
      return { ok: false, skipped: "already has label" };
    }
    if (!orderHasShipToAddress(order)) {
      return { ok: false, skipped: "missing shipping address" };
    }

    if (order.productId === BEAN_BOOK_2027.id) {
      return { ok: false, skipped: "2027 pre-order" };
    }
    if (order.productId) {
      try {
        const product = await resolveProduct(order.productId);
        if (isPreorderProduct(product)) {
          return { ok: false, skipped: "pre-order product" };
        }
      } catch {
        // Unknown product id — still attempt label buy.
      }
    }

    const { rates } = await fetchRatesForOrder(orderId);
    const rate = pickBestRate(rates);
    if (!rate) {
      return { ok: false, skipped: "no shipping rates" };
    }

    await buyLabelForOrder(orderId, rate.objectId, {
      provider: rate.provider,
      service: rate.service,
    });

    console.info(
      `auto-buy label: order ${orderId} → ${rate.provider} ${rate.service} $${rate.amount}`,
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "auto-buy failed";
    console.error(`auto-buy label failed for ${orderId}:`, message);
    captureServerError(err, {
      tags: { area: "auto-buy-label" },
      extra: { orderId },
    });
    return { ok: false, error: message };
  }
}
