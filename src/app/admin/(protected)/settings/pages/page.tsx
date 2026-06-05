import { WebsiteEditor } from "@/components/admin/WebsiteEditor";
import { listCoffeeShops } from "@/lib/coffee-shops";
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

export default async function AdminPagesPage() {
  await ensurePagesSeeded();
  await ensureSiteSettings();

  const [pages, publishedSite, draftSite, coffeeShops] = await Promise.all([
    getAllPagesForAdmin(),
    getSiteConfig("published"),
    getSiteConfig("draft"),
    listCoffeeShops(),
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
    />
  );
}
