import type { ResolvedPageContent } from "@/lib/pages";
import { buildPageTextColorsContext } from "@/lib/pages/text-colors";
import { listCoffeeShops } from "@/lib/coffee-shops";
import { getGoogleMapEmbedUrl } from "@/lib/google-map";
import { resolvePageSections } from "@/lib/pages/sections";
import { listCatalogProducts } from "@/lib/products";
import { getSiteConfig, type SiteConfigVariant } from "@/lib/site-config";
import { PageSectionsView } from "@/components/pages/PageSectionsView";

type PageViewByTemplateProps = {
  page: ResolvedPageContent;
  configVariant?: SiteConfigVariant;
};

export async function PageViewByTemplate({
  page,
  configVariant = "published",
}: PageViewByTemplateProps) {
  const site = await getSiteConfig(configVariant);
  const textColors = buildPageTextColorsContext(
    page.template,
    page.textColorOverrides,
    site.colors.text,
  );
  const sections = resolvePageSections(
    { ...page, storedSections: page.sections },
    site,
  );
  const needsShops = sections.some((section) => section.type === "shop-directory");
  const needsCatalog = sections.some((section) => section.type === "product");
  const [shops, catalogProducts] = await Promise.all([
    needsShops ? listCoffeeShops({ activeOnly: true }) : Promise.resolve([]),
    needsCatalog
      ? listCatalogProducts(true)
      : Promise.resolve([]),
  ]);

  return (
    <PageSectionsView
      page={page}
      sections={sections}
      textColors={textColors}
      shops={shops}
      catalogProducts={catalogProducts}
      mapEmbedUrl={getGoogleMapEmbedUrl()}
    />
  );
}
