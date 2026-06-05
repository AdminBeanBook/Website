import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export default async function PreviewSoWhatIsItPage() {
  const page = await getPageContent("so-what-is-it", "draft");
  if (!page) return null;
  return <PageViewByTemplate page={page} configVariant="draft" />;
}
