import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutSuccessTracker } from "@/components/analytics/CheckoutSuccessTracker";
import { captureServerError } from "@/lib/sentry/capture";
import { syncOrderFromCheckoutSession } from "@/lib/sync-order";

export const metadata: Metadata = {
  title: "Thanks for purchasing!",
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
      <section className="flex min-h-[60vh] flex-col items-center justify-center bg-brand-beige px-6 py-20 text-center">
        <h1 className="text-3xl font-light tracking-wide text-brand-text md:text-4xl">
          Thanks for purchasing!
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-brand-text/80">
          Your Bean Book order is confirmed. We&apos;ll email your receipt and
          ship your passbook soon.
        </p>
        <Link href="/" className="btn-primary mt-10">
          Back to home
        </Link>
      </section>
    </>
  );
}
