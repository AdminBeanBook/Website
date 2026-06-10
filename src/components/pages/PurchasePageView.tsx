"use client";

import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import { useCheckout } from "@/hooks/useCheckout";
import type { ResolvedPageContent } from "@/lib/pages";
import {
  colorStyle,
  type PageTextColorsContext,
} from "@/lib/pages/text-colors";

type PurchasePageViewProps = {
  page: ResolvedPageContent;
  textColors: PageTextColorsContext;
};

export function PurchasePageView({ page, textColors }: PurchasePageViewProps) {
  const config = useSiteConfig();
  const { startCheckout, loading, error } = useCheckout();

  return (
    <>
      <PageHero
        title={page.title}
        subtitle={page.subtitle ?? undefined}
        textColors={textColors}
      />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-sm">
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            aria-label="Buy Bean Book: 2026 Edition for $25"
            className="group block w-full text-center disabled:cursor-wait disabled:opacity-80"
          >
            <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg bg-brand-cream shadow-lg transition group-hover:shadow-xl group-disabled:group-hover:shadow-lg">
              <Image
                src={config.images.productCover}
                alt=""
                fill
                className="object-contain p-4"
                sizes="320px"
              />
            </div>
            <h2
              className="mt-6 text-xl font-medium"
              style={colorStyle("productTitle", textColors)}
            >
              Bean Book: 2026 Edition
            </h2>
            <p
              className="mt-2 text-lg opacity-80"
              style={colorStyle("productPrice", textColors)}
            >
              $25.00 USD
            </p>
            {loading && (
              <p className="mt-3 text-sm opacity-70">Redirecting to checkout…</p>
            )}
          </button>

          {error && (
            <p className="mt-4 text-center text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <p
            className="mt-10 text-center text-xs opacity-60"
            style={colorStyle("finePrint", textColors)}
          >
            Secure checkout powered by Stripe. US shipping address required.
          </p>
        </div>
      </section>
    </>
  );
}
