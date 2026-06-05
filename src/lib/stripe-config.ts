/** True when STRIPE_SECRET_KEY is a test key (sk_test_...). */
export function isStripeTestMode(): boolean {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  return key.startsWith("sk_test_");
}

/** True when webhook signing secret is set (required for auto order updates). */
export function isStripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim());
}

export function getProductionSiteUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!url || url.includes("localhost")) return null;
  return url.replace(/\/$/, "");
}
