import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export default async function PreviewHomePage() {
  const page = await getPageContent("home", "draft");
  if (!page) return null;
  return <PageViewByTemplate page={page} configVariant="draft" />;
}
