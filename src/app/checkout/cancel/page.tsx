import type { Metadata } from "next";
import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import { PageHero } from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Checkout cancelled",
};

export default function CheckoutCancelPage() {
  return (
    <>
      <PageHero
        title="Checkout cancelled"
        subtitle="No charge was made. You can try again whenever you're ready."
      />

      <section className="px-6 py-12 text-center">
        <BuyButton label="Try again" />
        <div className="mt-6">
          <Link href="/purchase" className="text-sm text-brand-text/70 hover:underline">
            Return to purchase page
          </Link>
        </div>
      </section>
    </>
  );
}
