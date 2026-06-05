import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export default async function PreviewPurchasePage() {
  const page = await getPageContent("purchase", "draft");
  if (!page) return null;
  return <PageViewByTemplate page={page} configVariant="draft" />;
}
