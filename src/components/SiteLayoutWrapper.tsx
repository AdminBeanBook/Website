import { SiteConfigProvider } from "@/components/SiteConfigProvider";
import { SiteThemeStyles } from "@/components/SiteThemeStyles";
import {
  getSiteConfig,
  type SiteConfigVariant,
} from "@/lib/site-config";

export async function SiteLayoutWrapper({
  children,
  variant = "published",
}: {
  children: React.ReactNode;
  variant?: SiteConfigVariant;
}) {
  const config = await getSiteConfig(variant);

  return (
    <SiteConfigProvider config={config}>
      <SiteThemeStyles colors={config.colors} />
      {children}
    </SiteConfigProvider>
  );
}
