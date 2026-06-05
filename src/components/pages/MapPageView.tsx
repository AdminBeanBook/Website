import { CoffeeShopCard } from "@/components/CoffeeShopCard";
import { CoffeeShopMap } from "@/components/CoffeeShopMap";
import { PageHero } from "@/components/PageHero";
import type { CoffeeShopRow } from "@/lib/coffee-shops";
import type { ResolvedPageContent } from "@/lib/pages";
import {
  colorStyle,
  type PageTextColorsContext,
} from "@/lib/pages/text-colors";

const MAP_EMBED_URL = process.env.NEXT_PUBLIC_GOOGLE_MAP_EMBED_URL;

type MapPageViewProps = {
  page: ResolvedPageContent;
  shops: CoffeeShopRow[];
  textColors: PageTextColorsContext;
  searchQuery?: string;
};

export function MapPageView({
  page,
  shops,
  textColors,
  searchQuery,
}: MapPageViewProps) {
  const query = searchQuery?.trim() ?? "";

  return (
    <>
      <PageHero
        title={page.title}
        subtitle={page.subtitle ?? undefined}
        textColors={textColors}
      />

      <section className="px-6 py-12">
        <h2 className="page-heading mb-2" style={colorStyle("sectionHeading", textColors)}>
          2026 Map
        </h2>
        <p
          className="mb-6 text-center opacity-80"
          style={colorStyle("sectionSubtext", textColors)}
        >
          Denver Metro Shops
        </p>

        <div className="mb-12">
          <CoffeeShopMap embedUrl={MAP_EMBED_URL} />
        </div>
        {query && (
          <p
            className="mb-8 text-center text-sm opacity-70"
            style={colorStyle("sectionSubtext", textColors)}
          >
            {shops.length} result{shops.length === 1 ? "" : "s"} for &ldquo;
            {query}&rdquo;
            {" · "}
            <a href="/map" className="underline">
              Clear search
            </a>
          </p>
        )}

        {shops.length === 0 ? (
          <p
            className="text-center opacity-70"
            style={colorStyle("sectionSubtext", textColors)}
          >
            No coffee shops match your search.{" "}
            <a href="/map" className="underline">
              View all shops
            </a>
          </p>
        ) : (
          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <CoffeeShopCard
                key={shop.id}
                shop={shop}
                textColors={textColors}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
