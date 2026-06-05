import { PageViewByTemplate } from "@/components/pages/PageViewByTemplate";
import { getPageContent } from "@/lib/pages";

export default async function HomePage() {
  const page = await getPageContent("home", "published");
  if (!page) return null;
  return <PageViewByTemplate page={page} />;
}
