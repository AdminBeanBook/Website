import type { Metadata } from "next";
import { MapPageView } from "@/components/pages/MapPageView";
import { listCoffeeShops } from "@/lib/coffee-shops";
import { getGoogleMapEmbedUrl } from "@/lib/google-map";
import { getPageContent } from "@/lib/pages";
import { buildPageTextColorsContext } from "@/lib/pages/text-colors";
import { getSiteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Map & Coffee Shops",
};

type MapPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function MapPage({ searchParams }: MapPageProps) {
  const { q } = await searchParams;
  const query = q?.trim().toLowerCase() ?? "";

  const [page, allShops, site] = await Promise.all([
    getPageContent("map", "published"),
    listCoffeeShops({ activeOnly: true }),
    getSiteConfig("published"),
  ]);
  if (!page) return null;

  const textColors = buildPageTextColorsContext(
    page.template,
    page.textColorOverrides,
    site.colors.text,
  );

  const shops = query
    ? allShops.filter(
        (shop) =>
          shop.name.toLowerCase().includes(query) ||
          shop.locations.some((loc) => loc.toLowerCase().includes(query)),
      )
    : allShops;

  return (
    <MapPageView
      page={page}
      shops={shops}
      textColors={textColors}
      searchQuery={q}
      mapEmbedUrl={getGoogleMapEmbedUrl()}
    />
  );
}
