import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BuyButton } from "@/components/BuyButton";
import { IMAGES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bean Book: 2026 Edition",
};

export default function ProductPage() {
  return (
    <section className="px-6 py-16">
      <div className="mx-auto grid max-w-4xl gap-12 md:grid-cols-2">
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-brand-cream">
          <Image
            src={IMAGES.productCover}
            alt="Bean Book: 2026 Edition cover"
            fill
            className="object-contain p-6"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="flex flex-col justify-center">
          <h1 className="text-3xl font-light text-brand-text">
            Bean Book: 2026 Edition
          </h1>
          <p className="mt-4 text-2xl text-brand-text/80">$25.00 USD</p>
          <p className="mt-6 leading-relaxed text-brand-text/90">
            Your Denver coffee passbook for 2026 — 27 featured shops with
            exclusive discounts, location details, and journal pages for your
            coffee adventures.
          </p>
          <div className="mt-8 flex flex-wrap items-start gap-4">
            <BuyButton label="Buy Now — $25" />
            <Link href="/purchase" className="btn-outline">
              Back to shop
            </Link>
          </div>
          <p className="mt-6 text-sm text-brand-text/60">
            Secure payment via Stripe Checkout.
          </p>
        </div>
      </div>
    </section>
  );
}
