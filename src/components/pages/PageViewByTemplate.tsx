import type { ResolvedPageContent } from "@/lib/pages";
import { buildPageTextColorsContext } from "@/lib/pages/text-colors";
import { listCoffeeShops } from "@/lib/coffee-shops";
import { getSiteConfig, type SiteConfigVariant } from "@/lib/site-config";
import { ContactPageView } from "@/components/pages/ContactPageView";
import { ContentPageView } from "@/components/pages/ContentPageView";
import { HomePageView } from "@/components/pages/HomePageView";
import { LearnMorePageView } from "@/components/pages/LearnMorePageView";
import { MapPageView } from "@/components/pages/MapPageView";
import { PurchasePageView } from "@/components/pages/PurchasePageView";
import { SoWhatIsItPageView } from "@/components/pages/SoWhatIsItPageView";

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

  switch (page.template) {
    case "home":
      return <HomePageView page={page} textColors={textColors} />;
    case "purchase":
      return <PurchasePageView page={page} textColors={textColors} />;
    case "contact":
      return <ContactPageView page={page} textColors={textColors} />;
    case "map": {
      const shops = await listCoffeeShops({ activeOnly: true });
      return <MapPageView page={page} shops={shops} textColors={textColors} />;
    }
    case "learn-more":
      return <LearnMorePageView page={page} textColors={textColors} />;
    case "so-what-is-it":
      return <SoWhatIsItPageView page={page} textColors={textColors} />;
    case "content":
    default:
      return <ContentPageView page={page} textColors={textColors} />;
  }
}
