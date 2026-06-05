import {
  getProductionSiteUrl,
  isStripeTestMode,
  isStripeWebhookConfigured,
} from "@/lib/stripe-config";

export function StripeSetupBanner() {
  const webhookOk = isStripeWebhookConfigured();
  const testMode = isStripeTestMode();
  const siteUrl = getProductionSiteUrl();

  if (webhookOk && !testMode) return null;

  return (
    <div className="space-y-3">
      {!webhookOk && (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <p className="font-medium">Stripe webhooks not configured</p>
          <p className="mt-1">
            Checkout and paid invoices will <strong>not</strong> update orders
            automatically until <code className="text-xs">STRIPE_WEBHOOK_SECRET</code>{" "}
            is set. Local: run{" "}
            <code className="text-xs">
              stripe listen --forward-to localhost:3000/api/webhooks/stripe
            </code>{" "}
            and paste the <code className="text-xs">whsec_...</code> into{" "}
            <code className="text-xs">.env.local</code>, then restart{" "}
            <code className="text-xs">npm run dev</code>. Production: see{" "}
            <code className="text-xs">PRODUCTION.md</code>.
          </p>
        </div>
      )}
      {testMode && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-950">
          <p className="font-medium">Stripe test mode</p>
          <p className="mt-1">
            Invoice emails are not sent via the API in test mode. Use{" "}
            <strong>View invoice in Stripe</strong> to pay or share the link.
            {siteUrl ? (
              <>
                {" "}
                For production, use live keys and a live webhook on{" "}
                <code className="text-xs">{siteUrl}/api/webhooks/stripe</code>.
              </>
            ) : (
              <>
                {" "}
                Set <code className="text-xs">NEXT_PUBLIC_SITE_URL</code> to your
                production domain before deploy.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
