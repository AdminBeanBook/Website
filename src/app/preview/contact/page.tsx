import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export default async function PreviewContactPage() {
  const page = await getPageContent("contact", "draft");
  if (!page) return null;
  return <PageViewByTemplate page={page} configVariant="draft" />;
}
