"use client";

import Image from "next/image";
import Link from "next/link";
import { PageHero } from "@/components/PageHero";
import { useSiteConfig } from "@/components/SiteConfigProvider";
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

  return (
    <>
      <PageHero
        title={page.title}
        subtitle={page.subtitle ?? undefined}
        textColors={textColors}
      />

      <section className="px-6 py-16">
        <div className="mx-auto max-w-sm">
          <Link
            href="/products/bean-book-2026-edition"
            className="group block text-center"
          >
            <div className="relative mx-auto aspect-[3/4] w-full max-w-xs overflow-hidden rounded-lg bg-brand-cream shadow-lg transition group-hover:shadow-xl">
              <Image
                src={config.images.productCover}
                alt="Bean Book: 2026 Edition"
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
          </Link>

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
