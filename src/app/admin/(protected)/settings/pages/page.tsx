import { WebsiteEditor } from "@/components/admin/WebsiteEditor";
import { listCoffeeShops } from "@/lib/coffee-shops";
import { getGoogleMapEmbedUrl } from "@/lib/google-map";
import {
  ensurePagesSeeded,
  getAllPagesForAdmin,
  pageHasUnpublishedChanges,
} from "@/lib/pages";
import {
  ensureSiteSettings,
  getSiteConfig,
  siteConfigHasUnpublishedChanges,
} from "@/lib/site-config";
import { listCatalogProducts } from "@/lib/products";

export default async function AdminPagesPage() {
  await ensurePagesSeeded();
  await ensureSiteSettings();

  const [pages, publishedSite, draftSite, coffeeShops, catalogProducts] =
    await Promise.all([
      getAllPagesForAdmin(),
      getSiteConfig("published"),
      getSiteConfig("draft"),
      listCoffeeShops(),
      listCatalogProducts(true),
    ]);

  const editorPages = pages.map((page) => ({
    ...page,
    hasUnpublishedChanges: pageHasUnpublishedChanges(page),
  }));

  return (
    <WebsiteEditor
      pages={editorPages}
      initialSiteConfig={draftSite}
      siteHasChanges={siteConfigHasUnpublishedChanges(
        publishedSite,
        draftSite,
      )}
      initialCoffeeShops={coffeeShops}
      catalogProducts={catalogProducts}
      mapEmbedUrl={getGoogleMapEmbedUrl()}
    />
  );
}
