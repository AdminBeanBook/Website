import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export default async function PreviewLearnMorePage() {
  const page = await getPageContent("learn-more", "draft");
  if (!page) return null;
  return <PageViewByTemplate page={page} configVariant="draft" />;
}
