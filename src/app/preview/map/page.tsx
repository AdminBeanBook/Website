import { MapPageView } from "@/components/pages/MapPageView";
import { listCoffeeShops } from "@/lib/coffee-shops";
import { getGoogleMapEmbedUrl } from "@/lib/google-map";
import { getPageContent } from "@/lib/pages";
import { buildPageTextColorsContext } from "@/lib/pages/text-colors";
import { getSiteConfig } from "@/lib/site-config";

export default async function PreviewMapPage() {
  const [page, shops, site] = await Promise.all([
    getPageContent("map", "draft"),
    listCoffeeShops({ activeOnly: true }),
    getSiteConfig("draft"),
  ]);
  if (!page) return null;
  const textColors = buildPageTextColorsContext(
    page.template,
    page.textColorOverrides,
    site.colors.text,
  );
  return (
    <MapPageView
      page={page}
      shops={shops}
      textColors={textColors}
      mapEmbedUrl={getGoogleMapEmbedUrl()}
    />
  );
}
