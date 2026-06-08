"use client";

import Image from "next/image";
import { useSiteConfig } from "@/components/SiteConfigProvider";
import type { ResolvedPageContent } from "@/lib/pages";
import { parseHomeBody } from "@/lib/pages/home-body";
import {
  colorStyle,
  type PageTextColorsContext,
} from "@/lib/pages/text-colors";

type HomePageViewProps = {
  page: ResolvedPageContent;
  textColors: PageTextColorsContext;
};

export function HomePageView({ page, textColors }: HomePageViewProps) {
  const config = useSiteConfig();
  const { description, paragraph } = parseHomeBody(page.body);

  return (
    <>
      <section className="relative min-h-[70vh] bg-brand-beige md:min-h-[85vh]">
        <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-6 py-20 text-center md:min-h-[85vh]">
          <h2
            className="max-w-2xl whitespace-pre-line text-2xl font-light tracking-wide drop-shadow-sm md:text-3xl lg:text-4xl"
            style={colorStyle("heroTitle", textColors)}
          >
            {page.title}
          </h2>
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <Image
            src={config.images.heroMug}
            alt=""
            fill
            className="object-cover object-right-bottom opacity-90"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-brand-beige/40" />
        </div>
      </section>

      <section className="relative bg-white px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            className="page-heading whitespace-pre-line"
            style={colorStyle("sectionTitle", textColors)}
          >
            {page.subtitle ?? "The Bean Book"}
          </h2>
          {description && (
            <p
              className="prose-bb mt-8 whitespace-pre-line"
              style={colorStyle("sectionBody", textColors)}
            >
              {description}
            </p>
          )}
          {paragraph && (
            <p
              className="prose-bb whitespace-pre-line"
              style={colorStyle("sectionBody", textColors)}
            >
              {paragraph}
            </p>
          )}
        </div>
      </section>

      <section className="bg-brand-cream px-6 py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 md:grid-cols-4">
          {config.images.gallery.map((src, i) => (
            <div
              key={src}
              className="relative aspect-square overflow-hidden rounded-lg shadow-md"
            >
              <Image
                src={src}
                alt={`Bean Book gallery ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
                unoptimized={src.startsWith("/uploads/")}
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
