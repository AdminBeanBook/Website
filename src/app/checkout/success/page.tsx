import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutSuccessTracker } from "@/components/analytics/CheckoutSuccessTracker";
import { PageHero } from "@/components/PageHero";
import { captureServerError } from "@/lib/sentry/capture";
import { syncOrderFromCheckoutSession } from "@/lib/sync-order";

export const metadata: Metadata = {
  title: "Order confirmed",
};

type SuccessPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  if (sessionId) {
    try {
      await syncOrderFromCheckoutSession(sessionId);
    } catch (err) {
      captureServerError(err, {
        tags: { area: "checkout-success" },
        extra: { sessionId },
      });
    }
  }

  return (
    <>
      <CheckoutSuccessTracker sessionId={sessionId} />
      <PageHero
        title="Thank you!"
        subtitle="Your Bean Book order is confirmed. We'll send a receipt to your email and ship your passbook soon."
      />

      <section className="px-6 py-12 text-center">
        {sessionId && (
          <p className="mb-6 text-sm text-brand-text/60">
            Order reference: {sessionId}
          </p>
        )}
        <p className="prose-bb mx-auto">
          While you wait, explore the featured coffee shops on our map and plan
          your first stops.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/map" className="btn-primary">
            View coffee shops
          </Link>
          <Link href="/" className="btn-outline">
            Back to home
          </Link>
        </div>
      </section>
    </>
  );
}
